/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import {
  IForgotPasswordPayload,
  ILoginResponse,
  ILoginUserPayload,
  IRegisterUserPayload,
  IResetPasswordPayload,
  IVerifyEmailPayload,
} from "./auth.interface";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { redisClient } from "../../lib/redis";
import path from "path";
import ejs from "ejs";
import { transporter } from "../../lib/nodemailer";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ১. ইউজার রেজিস্ট্রেশন
const registerUser = async (payload: IRegisterUserPayload) => {
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists!",
    );
  }

  // পাসওয়ার্ড হ্যাশিং
  const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
  const passwordHash = await bcrypt.hash(payload.password, saltRounds);

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash,
      phone: payload.phone,
      role: payload.role || "CUSTOMER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      status: true,
      createdAt: true,
    },
  });

  return newUser;
};

// ২. ইউজার লগইন
const loginUser = async (
  payload: ILoginUserPayload,
): Promise<ILoginResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found with this email!");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been blocked. Please contact support.",
    );
  }

  // পাসওয়ার্ড ম্যাচ করা
  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );
  if (!isPasswordMatched) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid password credentials!",
    );
  }

  // JWT টোকেন তৈরি
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as any,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as any,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
    },
  };
};

// ৩. রিফ্রেশ টোকেন দিয়ে নতুন অ্যাক্সেস টোকেন আনা
const refreshToken = async (token: string) => {
  const verifiedToken = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

  if (!verifiedToken.success) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired refresh token!",
    );
  }

  const { userId } = verifiedToken.data as { userId: string };

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "User is invalid or blocked!");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as any,
  );

  return {
    accessToken: newAccessToken,
  };
};

// ৪. বর্তমান লগইন ইউজারের প্রোফাইল
const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      store: true, // ভেন্ডর হলে স্টোরের তথ্যসহ আসবে
      addresses: true, // কাস্টমারের ঠিকানা
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const { email, otp } = payload;
  const key = `verify-email-otp:${email.trim().toLowerCase()}`;
  const redisOtp = await redisClient.get(key);
  if (!redisOtp) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "OTP has expired or is invalid!",
    );
  }
  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match!");
  }
  // ডাটাবেজে ইউজার ভেরিফায়েড করে দেওয়া
  const updatedUser = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { emailVerified: true },
  });
  await redisClient.del(key);
  return { message: "Email verified successfully! You can now log in." };
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const email = payload.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "No user found with this email!");
  }
  if (user.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account is blocked.");
  }
  const otp = crypto.randomInt(100000, 1000000).toString();
  const key = `forgot-password-otp:${email}`;
  // টার্মিনালে ওটিপি দেখতে পাওয়ার জন্য:
  console.log(`\n🔑 [DEV FORGOT OTP] ${email} : 👉 ${otp} 👈\n`);
  // Redis-এ ৫ মিনিটের জন্য সেভ রাখা
  await redisClient.set(key, otp, { EX: 300 });
  try {
    const templatePath = path.join(
      process.cwd(),
      "src/app/templates/forgot-password.ejs",
    );
    const html = await ejs.renderFile(templatePath, {
      name: user.name,
      otp,
      expirationMinutes: 5,
    });
    await transporter.sendMail({
      from: config.email_sender || "no-reply@nexusmarket.com",
      to: email,
      subject: "Password Reset Request - Nexus Market",
      html,
    });
  } catch (err) {
    console.log("Nodemailer error (ignored in dev):", err);
  }
  return { message: "Password reset OTP sent to your email!" };
};
// ৮. রিসেট পাসওয়ার্ড (OTP মিলিয়ে নতুন পাসওয়ার্ড সেট করা)
const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }
  const key = `forgot-password-otp:${normalizedEmail}`;
  const redisOtp = await redisClient.get(key);
  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP has expired!");
  }
  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match!");
  }
  const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { passwordHash },
  });
  await redisClient.del(key);
  try {
    const templatePath = path.join(
      process.cwd(),
      "src/app/templates/reset-password-success.ejs",
    );
    const html = await ejs.renderFile(templatePath, { name: user.name });
    await transporter.sendMail({
      from: config.email_sender || "no-reply@nexusmarket.com",
      to: normalizedEmail,
      subject: "Password Changed Successfully",
      html,
    });
  } catch (err) {
    console.log("Nodemailer error:", err);
  }
  return { message: "Password has been reset successfully!" };
};

// ৫. গুগল সোশ্যাল লগইন
const googleLogin = async (idToken: string) => {
  // গুগলের সার্ভার থেকে টোকেনটি ভেরিফাই করা
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid Google credentials!");
  }

  const { email, name, picture } = payload;

  // চেক করা ইউজার ডাটাবেজে আছে কি না
  let user = await prisma.user.findUnique({
    where: { email },
  });

  // ইউজার না থাকলে স্বয়ংক্রিয়ভাবে নতুন ইউজার তৈরি হবে
  if (!user) {
    const randomPassword = Math.random().toString(36).slice(-8) + "Aa1@";
    const passwordHash = await bcrypt.hash(randomPassword, 12);

    user = await prisma.user.create({
      data: {
        email,
        name: name || "Google User",
        avatar: picture || null,
        passwordHash,
        role: "CUSTOMER",
      },
    });
  }

  if (user.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "Your account has been blocked.");
  }

  // আমাদের সিস্টেমের নিজস্ব JWT টোকেন জেনারেট করা
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as any,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as any,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  };
};

export const authService = {
  registerUser,
  loginUser,
  refreshToken,
  getMyProfile,
  googleLogin,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
