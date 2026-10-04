/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import config from '../../config';
import { AppError } from '../../utils/AppError';
import { jwtUtils } from '../../utils/jwt';
import { ILoginResponse, ILoginUserPayload, IRegisterUserPayload } from './auth.interface';

// ১. ইউজার রেজিস্ট্রেশন
const registerUser = async (payload: IRegisterUserPayload) => {
  const isUserExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (isUserExist) {
    throw new AppError(httpStatus.CONFLICT, 'User with this email already exists!');
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
      role: payload.role || 'CUSTOMER',
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
const loginUser = async (payload: ILoginUserPayload): Promise<ILoginResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found with this email!');
  }

  if (user.status === 'BLOCKED') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account has been blocked. Please contact support.');
  }

  // পাসওয়ার্ড ম্যাচ করা
  const isPasswordMatched = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid password credentials!');
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
    config.jwt_access_expires_in as any
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as any
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
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token!');
  }

  const { userId } = verifiedToken.data as { userId: string };

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.status === 'BLOCKED') {
    throw new AppError(httpStatus.FORBIDDEN, 'User is invalid or blocked!');
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
    config.jwt_access_expires_in as any
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
      store: true,     // ভেন্ডর হলে স্টোরের তথ্যসহ আসবে
      addresses: true, // কাস্টমারের ঠিকানা
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const authService = {
  registerUser,
  loginUser,
  refreshToken,
  getMyProfile,
};