/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import httpStatus from 'http-status';
import { ICreatePayoutRequestPayload, IPayoutFilterOptions, IUpdatePayoutStatusPayload } from './payout.interface';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { IPaginationOptions } from '../../interface/pagination';
import { calculatePagination } from '../../utils/paginationHelper';


// ১. ভেন্ডার পে-আউট রিকোয়েস্ট তৈরি করা (ব্যালেন্স হোল্ডসহ)
const createPayoutRequest = async (
  userId: string,
  payload: ICreatePayoutRequestPayload,
) => {

  // ক. ইউজারের স্টোরটি খুঁজে বের করা
  const store = await prisma.store.findFirst({
    where: { userId },
  });

  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, 'You do not own any store!');
  }

  if (store.verificationStatus !== 'APPROVED') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your store is not approved yet! Cannot request payout.',
    );
  }

  // খ. ওয়ালেটে পর্যাপ্ত ব্যালেন্স আছে কি না যাচাই
  if (store.walletBalance < payload.amount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient wallet balance! Your available balance is ৳${store.walletBalance}`,
    );
  }

  // গ. ইতোমধ্যে কোনো পেন্ডিং রিকোয়েস্ট আছে কি না চেক (একসাথে একাধিক পেন্ডিং বন্ধ করতে)
  const existingPending = await prisma.payoutRequest.findFirst({
    where: {
      storeId: store.id,
      status: 'PENDING',
    },
  });

  if (existingPending) {
    throw new AppError(
      httpStatus.CONFLICT,
      'You already have a pending payout request in review. Please wait until admin processes it!',
    );
  }

  // ঘ. এটমিক ট্রানজ্যাকশন: ব্যালেন্স মাইনাস করা এবং রিকোয়েস্ট তৈরি করা
  const result = await prisma.$transaction(async (tx) => {
    // স্টোর ওয়ালেট থেকে উইথড্র অ্যামাউন্ট সাময়িকভাবে কেটে রাখা
    await tx.store.update({
      where: { id: store.id },
      data: {
        walletBalance: {
          decrement: payload.amount,
        },
      },
    });

    // নতুন পে-আউট রিকোয়েস্ট তৈরি
    const payout = await tx.payoutRequest.create({
      data: {
        storeId: store.id,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        accountInfo: payload.accountInfo,
        status: 'PENDING',
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            walletBalance: true,
          },
        },
      },
    });
    return payout;
  });
  return result;
};


// ২. ভেন্ডারের নিজের সব পে-আউট রিকোয়েস্টের তালিকা দেখা
const getMyPayoutRequests = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const store = await prisma.store.findFirst({
    where: { userId },
  });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, 'Store not found!');
  }
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const [payouts, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where: { storeId: store.id },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.payoutRequest.count({ where: { storeId: store.id } }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: payouts,
  };
};


// ৩. অ্যাডমিনের সব ভেন্ডারের পে-আউট রিকোয়েস্ট দেখা
const getAllPayoutRequests = async (
  paginationOptions: IPaginationOptions,
  filterOptions: IPayoutFilterOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);

  const whereConditions: any = {};

  if (filterOptions.status) {
    whereConditions.status = filterOptions.status;
  }

  const [payouts, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            walletBalance: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    }),
    prisma.payoutRequest.count({ where: whereConditions }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: payouts,
  };
};


// ৪. অ্যাডমিন কর্তৃক স্ট্যাটাস আপডেট (APPROVE বা REJECT)
const updatePayoutStatus = async (
  requestId: string,
  payload: IUpdatePayoutStatusPayload,
) => {
  const payout = await prisma.payoutRequest.findUnique({
    where: { id: requestId },
  });

  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payout request not found!');
  }

  if (payout.status !== 'PENDING') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot modify a payout request that is already ${payout.status}!`,
    );
  }

  // ক. যদি রিজেক্ট হয়: কেটে রাখা টাকা ভেন্ডারকে রিফান্ড করতে হবে
  if (payload.status === 'REJECTED') {
    const updated = await prisma.$transaction(async (tx) => {
      // টাকা ওয়ালেটে ফেরত দেওয়া
      await tx.store.update({
        where: { id: payout.storeId },
        data: {
          walletBalance: {
            increment: payout.amount,
          },
        },
      });
      // স্ট্যাটাস রিজেক্ট করা
      return await tx.payoutRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          adminNotes: payload.adminNotes || 'Request rejected by admin.',
        },
      });
    });
    return updated;
  }

  // খ. যদি এপ্রুভ হয়: স্ট্যাটাস আপডেট ও রেফারেন্স নোট সেভ করা
  const updated = await prisma.payoutRequest.update({
    where: { id: requestId },
    data: {
      status: payload.status,
      adminNotes: payload.adminNotes || 'Payout approved and funds transferred.',
    },
  });
  return updated;
};


// ৫. ভেন্ডারের ওয়ালেট ও উইথড্রয়াল সামারি
const getVendorPayoutStats = async (userId: string) => {
  const store = await prisma.store.findFirst({
    where: { userId },
  });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, 'Store not found!');
  }
  const [totalWithdrawn, pendingWithdrawal] = await Promise.all([
    prisma.payoutRequest.aggregate({
      where: { storeId: store.id, status: 'APPROVED' },
      _sum: { amount: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { storeId: store.id, status: 'PENDING' },
      _sum: { amount: true },
    }),
  ]);
  return {
    walletBalance: store.walletBalance,
    pendingBalance: store.pendingBalance,
    totalWithdrawn: totalWithdrawn._sum.amount || 0,
    pendingWithdrawal: pendingWithdrawal._sum.amount || 0,
  };
};



export const PayoutService = {
  createPayoutRequest,
  getMyPayoutRequests,
  getAllPayoutRequests,
  updatePayoutStatus,
  getVendorPayoutStats,
};