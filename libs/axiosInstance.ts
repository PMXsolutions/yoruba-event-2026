import useAuthStore from "@/store/use-auth-store";
import axios, { AxiosError, AxiosResponse } from "axios";

// Define the structure of your API response data
interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  // Add other fields if needed
}

// Define the structure of your specific response data
interface DataStructure {
  // Define the structure based on your API response
  // For example:
  id: number;
  name: string;
  // Add other fields as per your response data
}

const baseURL =
  process.env.EXPO_PUBLIC_API_BASEURL ||
  "https://api.promaxcare.com.au/api";

export const publicAxios = axios.create({
  baseURL,
  timeout: 30000,
});

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const authToken = useAuthStore.getState().token;
    if (authToken) {
      config.headers["Authorization"] = `Bearer ${authToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<DataStructure>>) => response,
  (error: AxiosError) => {
    const { response } = error;
    if (response) {
      switch (response.status) {
        case 401: // Unauthorized
          // toast.error("Session Time Out!!");
          void useAuthStore.getState().logout();
          //   localStorage.setItem("redirectPath", window.location.pathname);

          break;

        case 403:
          // Forbidden responses are authorization failures for one action, not
          // proof that the whole session is invalid.
          break;

        case 404:
          // Perform actions to handle the 404 error
          // window.location.href = '/not-found';
          break;
        case 500:
          // toast.error("Ooops! An error occured ");
          // Perform actions to handle the 500 error
          // window.location.href = '/error';
          break;
        default:
          // Perform actions for other errors
          // window.location.href = '/error-page';
          break;
      }
    } else {
      throw error;
      // window.location.href = '/network-error';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
