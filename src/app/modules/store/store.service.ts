import { Role, VerificationStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { calculatePagination } from "../../utils/paginationHelper";
import { ICreateStorePayload, IStoreFilterRequest, IUpdateStorePayload } from "./store.interface";
import httpStatus from 'http-status';


// স্লাগ তৈরির কমন হেল্পার
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};


// ১. দোকান তৈরি করা ও রোল আপগ্রেড
const createStore = async (userId: string, payload: ICreateStorePayload) => {
  // চেক করা ইউজারের অলরেডি কোনো দোকান আছে কি না
  const isStoreExist = await prisma.store.findUnique({
    where: { userId },
  });
  if (isStoreExist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You already have an existing store!');
  }
  // স্লাগ তৈরি ও ডুপ্লিকেট হ্যান্ডলিং
  let slug = generateSlug(payload.name);
  const isSlugExist = await prisma.store.findUnique({ where: { slug } });
  if (isSlugExist) {
    slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
  }
  // Prisma Transaction: দোকান তৈরি হবে + ইউজার রোল VENDOR হবে
  const result = await prisma.$transaction(async (tx) => {
    const newStore = await tx.store.create({
      data: {
        userId,
        name: payload.name,
        slug,
        description: payload.description,
        logo: payload.logo,
        banner: payload.banner,
        tradeLicense: payload.tradeLicense,
        verificationStatus: VerificationStatus.PENDING,
        walletBalance: 0.0,
        pendingBalance: 0.0,
      },
    });
    // রোল VENDOR করা
    await tx.user.update({
      where: { id: userId },
      data: { role: Role.VENDOR },
    });
    return newStore;
  });
  return result;
};


// ২. ভেন্ডরের নিজস্ব দোকান দেখা
const getMyStore = async (userId: string) => {
  const store = await prisma.store.findUnique({
    where: { userId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      _count: {
        select: { products: true, subOrders: true },
      },
    },
  });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, 'You do not have a store yet!');
  }
  return store;
};



// ৩. দোকান আপডেট করা
const updateMyStore = async (userId: string, payload: IUpdateStorePayload) => {
  const store = await prisma.store.findUnique({ where: { userId } });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, 'Store not found!');
  }
  const updatedStore = await prisma.store.update({
    where: { userId },
    data: payload,
  });
  return updatedStore;
};


// ৪. পাবলিক স্টোর প্রোফাইল (স্লাগ দিয়ে যে কেউ দেখতে পারবে)
const getStoreBySlug = async (slug: string) => {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isPublished: true },
        include: {
          variants: true,
          category: true,
        },
      },
    },
  });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, 'Store not found with this slug!');
  }
  return store;
};


// ৫. সমস্ত স্টোরের তালিকা (ফিল্টারিং ও পেজিনেশনসহ)
const getAllStores = async (filters: IStoreFilterRequest, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options);
  const { searchTerm, verificationStatus } = filters;
  const andConditions: any[] = [];
  // সার্চ টার্ম থাকলে নাম বা স্লাগে খুঁজবে
  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }
  // স্ট্যাটাস ফিল্টার
  if (verificationStatus) {
    andConditions.push({ verificationStatus });
  }
  const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
  const stores = await prisma.store.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { products: true } },
    },
  });
  const total = await prisma.store.count({ where: whereConditions });
  return {
    meta: { page, limit, total },
    data: stores,
  };
};


// ৬. সুপার অ্যাডমিন দ্বারা স্টোর অনুমোদন বা বাতিল
const updateStoreStatus = async (storeId: string, status: VerificationStatus) => {
  const isStoreExist = await prisma.store.findUnique({ where: { id: storeId } });
  if (!isStoreExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Store not found!');
  }
  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: { verificationStatus: status },
  });
  return updatedStore;
};



export const storeService = {
  createStore,
  getMyStore,
  updateMyStore,
  getStoreBySlug,
  getAllStores,
  updateStoreStatus,
};