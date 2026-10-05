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
import { AuthProvider, Role, UserStatus } from "../../../generated/prisma/enums";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ১. রেজিস্ট্রেশন রিকোয়েস্ট (ডাটাবেজে সেভ হবে না, OTP ও ডাটা Redis-এ ৫ মিনিটের জন্য থাকবে)
const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, password, phone, role } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(httpStatus.CONFLICT, 'User with this email already exists!');
  }

  const saltRounds = Number(config.bcrypt_salt_rounds) || 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // ৬ ডিজিটের ওটিপি তৈরি
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expirationSeconds = 5 * 60; // ৫ মিনিট

  console.log(`\n🔑 [DEV OTP] Verification OTP for ${email}: 👉 ${otp} 👈\n`);

  // Redis-এ OTP রাখা
  await redisClient.set(`verify-email-otp:${email}`, otp, { EX: expirationSeconds });

  // Redis-এ ইউজারের সাইন-আপ ডাটা রাখা
  await redisClient.set(
    `user-registration-data:${email}`,
    JSON.stringify({ name, email, passwordHash, phone, role }),
    { EX: expirationSeconds }
  );

  // ইমেইলে OTP পাঠানো
  try {
    const templatePath = path.join(process.cwd(), 'src/app/templates/registration-user-otp.ejs');
    const html = await ejs.renderFile(templatePath, {
      name,
      email,
      otp,
      expirationSeconds: 5,
    });

    await transporter.sendMail({
      from: config.email_sender || 'no-reply@nexusmarket.com',
      to: email,
      subject: 'Verify Your Email - Nexus Market',
      html,
    });
  } catch (err) {
    console.log('Nodemailer error (ignored in dev):', err);
  }

  return { message: 'Verification OTP sent to your email!' };
};

// ২. OTP ভেরিফাই করে আসল ইউজার ডাটাবেজে তৈরি করা
const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const { email, otp } = payload;
  const normalizedEmail = email.trim().toLowerCase();

  const otpKey = `verify-email-otp:${normalizedEmail}`;
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP has expired or is invalid!');
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, 'OTP does not match!');
  }

  // Redis থেকে ক্যাশ করা সাইন-আপ ডাটা আনা
  const registrationDataKey = `user-registration-data:${normalizedEmail}`;
  const redisData = await redisClient.get(registrationDataKey);

  if (!redisData) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Registration session expired. Please register again.');
  }

  const userData = JSON.parse(redisData);

  // ডাটাবেজে আসল ইউজার তৈরি (emailVerified: true)
  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      phone: userData.phone,
      role: userData.role || Role.CUSTOMER,
      emailVerified: true,
      authProvider: AuthProvider.CREDENTIAL,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      avatar: true,
      emailVerified: true,
    },
  });

  // Redis ডাটা ক্লিন করা
  await redisClient.del([otpKey, registrationDataKey]);

  // ওয়েলকাম ইমেইল পাঠানো
  try {
    const templatePath = path.join(process.cwd(), 'src/app/templates/welcome-email.ejs');
    const html = await ejs.renderFile(templatePath, { name: newUser.name });

    await transporter.sendMail({
      from: config.email_sender,
      to: normalizedEmail,
      subject: 'Welcome To Nexus Market! 🎉',
      html,
    });
  } catch (err) {
    console.log('Welcome mail error:', err);
  }

  // স্বয়ংক্রিয়ভাবে লগইন টোকেন জেনারেট
  const jwtPayload = {
    userId: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as any
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as any
  );

  return { user: newUser, accessToken, refreshToken };
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
