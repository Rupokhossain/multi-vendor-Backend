/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import httpStatus from 'http-status';
import { IApplyCouponPayload, ICouponFilterOptions, ICreateCouponPayload, IUpdateCouponPayload } from './coupon.interface';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { IPaginationOptions } from '../../interface/pagination';
import { calculatePagination } from '../../utils/paginationHelper';


const createCoupon = async (payload: ICreateCouponPayload) => {
  const code = payload.code.toUpperCase().trim();
  const existingCoupon = await prisma.coupon.findUnique({
    where: { code },
  });
  if (existingCoupon) {
    throw new AppError(httpStatus.CONFLICT, 'Coupon code already exists!');
  }
  const coupon = await prisma.coupon.create({
    data: {
      code,
      discountType: payload.discountType,
      value: payload.value,
      minPurchase: payload.minPurchase ?? 0,
      maxDiscount: payload.maxDiscount,
      usageLimit: payload.usageLimit,
      expiresAt: new Date(payload.expiresAt),
      isActive: payload.isActive ?? true,
    },
  });
  return coupon;
};


const applyCoupon = async (userId: string, payload: IApplyCouponPayload) => {
  
    const code = payload.code.toUpperCase().trim();

  // ক. কুপনটি ডাটাবেজে আছে কি না চেক
  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Invalid coupon code!');
  }

  // খ. কুপন একটিভ আছে কি না
  if (!coupon.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This coupon is no longer active!');
  }

  // গ. মেয়াদ শেষ হয়েছে কি না
  if (new Date(coupon.expiresAt) < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'This coupon has expired!');
  }

  // ঘ. ব্যবহারের সীমা (Usage Limit) পার হয়েছে কি না
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This coupon usage limit has been reached!',
    );
  }

  // ঙ. অর্ডার অ্যামাউন্ট বের করা (বডিতে না থাকলে ইউজারের কার্ট থেকে অটোমেটিক রিড করবে)
  let amount = payload.orderAmount;

  if (!amount) {
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: { variant: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Your cart is empty! Provide orderAmount or add items to cart.',
      );
    }
    amount = cart.items.reduce((total, item) => {
      const price = item.variant.discountPrice || item.variant.price;
      return total + price * item.quantity;
    }, 0);
  }

  // চ. সর্বনিম্ন ক্রয়ের শর্ত পূরণ হয়েছে কি না
  if (amount < coupon.minPurchase) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Minimum purchase of ৳${coupon.minPurchase} is required to apply this coupon! Current amount: ৳${amount}`,
    );
  }

  // ছ. ডিসকাউন্ট ক্যালকুলেশন
  let discount = 0;
  if (String(coupon.discountType) === 'PERCENTAGE') {
    discount = (amount * coupon.value) / 100;
    // সর্বোচ্চ ছাড়ের ক্যাপ (Max Discount Limit) চেক
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    // Flat / Fixed Discount
    discount = coupon.value;
    if (discount > amount) {
      discount = amount;
    }
  }
  discount = Math.round(discount * 100) / 100;
  const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);
  return {
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountRate: coupon.value,
    orderAmount: amount,
    discountAmount: discount,
    finalAmount,
  };
};



const getAllCoupons = async (
  paginationOptions: IPaginationOptions,
  filterOptions: ICouponFilterOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const whereConditions: any = {};
  if (filterOptions.searchTerm) {
    whereConditions.code = {
      contains: filterOptions.searchTerm,
      mode: 'insensitive',
    };
  }
  if (filterOptions.isActive !== undefined) {
    whereConditions.isActive = filterOptions.isActive === 'true';
  }
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.coupon.count({ where: whereConditions }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: coupons,
  };
};



const getActiveCoupons = async () => {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      code: true,
      discountType: true,
      value: true,
      minPurchase: true,
      maxDiscount: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return coupons;
};


// ৫. সিঙ্গেল কুপন বিস্তারিত দেখা
const getCouponById = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
  });
  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found!');
  }
  return coupon;
};


// ৬. কুপন আপডেট করা (Admin only)
const updateCoupon = async (id: string, payload: IUpdateCouponPayload) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
  });
  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found!');
  }
  const updateData: any = { ...payload };
  if (payload.expiresAt) {
    updateData.expiresAt = new Date(payload.expiresAt);
  }
  const updated = await prisma.coupon.update({
    where: { id },
    data: updateData,
  });
  return updated;
};


// ৭. কুপন মুছে ফেলা (Admin only)
const deleteCoupon = async (id: string) => {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
  });
  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, 'Coupon not found!');
  }
  await prisma.coupon.delete({
    where: { id },
  });
  return { message: 'Coupon deleted successfully!' };
};


export const CouponService = {
  createCoupon,
  applyCoupon,
  getAllCoupons,
  getActiveCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};