import { publicAxios } from "@/libs/axiosInstance";
import { ForgotpasswordSchema, SigninFormSchema } from "@/modules/auth/types";
import { isAxiosError } from "axios";

const loginUser = async (payload: SigninFormSchema) => {
  try {
    const { data } = await publicAxios.post(
      "/Account/auth_login?medium=Mobile",
      payload
    );

    return data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      throw error;
    }
  }
};

const forgotPassword = async ({ email }: ForgotpasswordSchema) => {
  try {
    const { data } = await publicAxios.get(
      `/Account/forgot_password?email=${encodeURIComponent(email)}`
    );

    return data;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      throw error;
    }
    return error;
  }
};

const resetPassword = async (payload: {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}) => {
  const { data } = await publicAxios.post("/Account/reset_password", {
    email: payload.email,
    otp: payload.otp,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  });
  return data;
};

// const { data } = await publicAxios.post("/Account/post_otp", postData);

// const loginUser = async ({
//     email,
//     password,
//   }: Record<string, string>): Promise<AuthSuccessResponse> => {
//     try {
//       const response = await http
//         .post('auth/login', {
//           json: { email, password },
//         })
//         .json<AuthSuccessResponse>();

//       if ('error' in response) {
//         throw new Error('Something went wrong');
//       }

//       return response;
//     } catch (error) {
//       if (error instanceof HTTPError) {
//         const errorBody = await error.response.json<AuthLoginResponse>();
//         throw new Error(errorBody.message || `HTTP error ${error.response.status}`);
//       }
//       throw error;
//     }
//   };

export const AuthService = { loginUser, forgotPassword, resetPassword };
