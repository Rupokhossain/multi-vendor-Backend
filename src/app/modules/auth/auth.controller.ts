import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { authService } from "./auth.service";
import config from "../../config";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message, // "Verification OTP sent to your email!"
    data: null,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.verifyEmail(req.body);

  res.cookie('refreshToken', result.refreshToken, {
    secure: config.node_env === 'production',
    httpOnly: true,
    sameSite: 'none',
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Email verified & account activated successfully!',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});
const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);

  // রিফ্রেশ টোকেন সিকিউর কুকিতে সেট করা
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: "none",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully!",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  const result = await authService.refreshToken(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New access token generated successfully!",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await authService.getMyProfile(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved successfully!",
    data: result,
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const { idToken } = req.body;
  const result = await authService.googleLogin(idToken);
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.node_env === "production",
    httpOnly: true,
    sameSite: "none",
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in via Google successfully!",
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});



const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const authController = {
  register,
  login,
  refreshToken,
  getMyProfile,
  googleLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
