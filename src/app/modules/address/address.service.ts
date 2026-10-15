import httpStatus from "http-status";
import {
  ICreateAddressPayload,
  IUpdateAddressPayload,
} from "./address.interfacet";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";

// ১. নতুন অ্যাড্রেস তৈরি করা
const createAddress = async (
  userId: string,
  payload: ICreateAddressPayload,
) => {
  const existingCount = await prisma.address.count({
    where: { userId },
  });

  // ১ম অ্যাড্রেস হলে অথবা ইউজার চাইলে স্বয়ংক্রিয়ভাবে ডিফল্ট হবে
  const shouldBeDefault = existingCount === 0 || payload.isDefault === true;

  return await prisma.$transaction(async (tx) => {
    // যদি ডিফল্ট হয়, তবে আগের সব অ্যাড্রেসের isDefault = false করা হবে
    if (shouldBeDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const newAddress = await tx.address.create({
      data: {
        userId,
        fullName: payload.fullName,
        phone: payload.phone,
        city: payload.city,
        area: payload.area,
        street: payload.street,
        postalCode: payload.postalCode || null,
        isDefault: shouldBeDefault,
      },
    });

    return newAddress;
  });
};

// ২. গ্রাহকের নিজের সব সেভ করা ঠিকানা দেখা
const getMyAddresses = async (userId: string) => {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return addresses;
};

// ৩. সিঙ্গেল অ্যাড্রেস বিস্তারিত দেখা
const getAddressById = async (
  userId: string,
  userRole: string,
  addressId: string,
) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });
  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found!");
  }
  if (
    address.userId !== userId &&
    userRole !== "ADMIN" &&
    userRole !== "SUPER_ADMIN"
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to view this address!",
    );
  }
  return address;
};

// ৪. অ্যাড্রেস এডিট / আপডেট করা
const updateAddress = async (
  userId: string,
  userRole: string,
  addressId: string,
  payload: IUpdateAddressPayload,
) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });
  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found!");
  }
  if (
    address.userId !== userId &&
    userRole !== "ADMIN" &&
    userRole !== "SUPER_ADMIN"
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this address!",
    );
  }
  return await prisma.$transaction(async (tx) => {
    if (payload.isDefault === true) {
      await tx.address.updateMany({
        where: { userId: address.userId },
        data: { isDefault: false },
      });
    }
    const updated = await tx.address.update({
      where: { id: addressId },
      data: payload,
    });
    return updated;
  });
};

// ৫. একটি নির্দিষ্ট অ্যাড্রেসকে ডিফল্ট হিসেবে সেট করা
const setDefaultAddress = async (userId: string, addressId: string) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });
  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found!");
  }
  if (address.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to modify this address!",
    );
  }
  return await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    const defaultAddress = await tx.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
    return defaultAddress;
  });
};


// ৬. অ্যাড্রেস মুছে ফেলা
const deleteAddress = async (
  userId: string,
  userRole: string,
  addressId: string,
) => {
  const address = await prisma.address.findUnique({
    where: { id: addressId },
  });
  if (!address) {
    throw new AppError(httpStatus.NOT_FOUND, "Address not found!");
  }
  if (
    address.userId !== userId &&
    userRole !== "ADMIN" &&
    userRole !== "SUPER_ADMIN"
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to delete this address!",
    );
  }
  await prisma.address.delete({
    where: { id: addressId },
  });
  return { message: "Address deleted successfully!" };
};


export const AddressService = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
