import { useState, useEffect, useRef } from "react";
import { Platform, Alert } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import axiosInstance from "@/libs/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NotificationData {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const usePushNotifications = (
  userId?: number | string | null,
  companyId?: number | string | null
) => {
  const shouldSkip =
    userId == null ||
    userId === "" ||
    companyId == null ||
    Number(companyId) === 0;
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    []
  );
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();
  const [loading, setLoading] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  // Send token to PromaxCare API (not third-party Render)
  const sendTokenToBackend = async (deviceToken: string) => {
    if (userId == null || companyId == null) {
      console.warn("Skipping DeviceTokens/add_token — missing userId/companyId");
      return;
    }
    try {
      await axiosInstance.post("/DeviceTokens/add_token", {
        Device_Token: deviceToken,
        UserId: String(userId),
        CompanyId: Number(companyId),
      });
      await AsyncStorage.setItem("fcmToken", deviceToken);
    } catch (error) {
      console.error("Error sending token to PromaxCare API:", error);
    }
  };

  useEffect(() => {
    if (shouldSkip) return;
    const setupPushNotifications = async () => {
      setLoading(true);
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) {
        setExpoPushToken(expoToken);
      }

      const fcmDeviceToken = await getFCMDevicePushTokenAsync();
      if (fcmDeviceToken) {
        console.log(fcmDeviceToken);
        setFcmToken(fcmDeviceToken);
        const storedToken = await AsyncStorage.getItem("fcmToken");
        if (storedToken !== fcmDeviceToken) {
          await sendTokenToBackend(fcmDeviceToken);
        } else {
          console.log("FCM Token is already sent to backend");
        }
      }

      if (Platform.OS === "android") {
        const androidChannels =
          await Notifications.getNotificationChannelsAsync();
        setChannels(androidChannels ?? []);
      }

      notificationListener.current =
        Notifications.addNotificationReceivedListener(
          (notification: Notifications.Notification) => {
            setNotification(notification);
          }
        );

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener(
          (response: Notifications.NotificationResponse) => {
            console.log("Notification Response:", response);
          }
        );

      setLoading(false);
    };

    setupPushNotifications();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [shouldSkip, userId, companyId]);

  const schedulePushNotification = async (
    notificationData: NotificationData
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationData.title || "Notification",
        body: notificationData.body || "Here is your notification!",
        data: { data: notificationData.data || {} },
      },
      trigger: null,
    });
  };

  return {
    expoPushToken,
    fcmToken,
    channels,
    notification,
    setNotification,
    schedulePushNotification,
    loading,
  };
};

// Register for push notifications
async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  let token: string | undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error("Project ID not found");
      }

      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Expo Push Token:", token);
    } catch (e) {
      console.error("Error getting expo push token", e);
    }
  } else {
    Alert.alert("Must use physical device for Push Notifications");
  }

  return token;
}

// Get FCM token
async function getFCMDevicePushTokenAsync(): Promise<string | null> {
  try {
    const fcmToken = (await Notifications.getDevicePushTokenAsync()).data;
    return fcmToken;
  } catch (error) {
    console.error("Failed to get FCM token", error);
    return null;
  }
}

export default usePushNotifications;
