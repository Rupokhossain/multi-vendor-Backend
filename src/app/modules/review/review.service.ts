/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import httpStatus from "http-status";
import { ICreateReviewPayload, IReviewFilterOptions, IUpdateReviewPayload } from "./review.interface";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IPaginationOptions } from "../../interface/pagination";
import { calculatePagination } from "../../utils/paginationHelper";

const createReview = async (userId: string, payload: ICreateReviewPayload) => {
  // ক. প্রোডাক্টটি আসলেই ডাটাবেজে আছে কি না চেক
  const product = await prisma.product.findUnique({
    where: { id: payload.productId },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found!");
  }
  // খ. এই ইউজার আগে অলরেডি এই প্রোডাক্টে রিভিউ দিয়েছে কি না (ডুপ্লিকেট প্রিভেনশন)
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      productId: payload.productId,
    },
  });
  if (existingReview) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already reviewed this product. You can update your existing review!",
    );
  }
  // গ. ভেরিফাইড বায়ার চেক: ইউজার এই প্রোডাক্ট কিনেছে এবং সাব-অর্ডার DELIVERED হয়েছে কি না
  const deliveredOrder = await prisma.order.findFirst({
    where: {
      customerId: userId,
      subOrders: {
        some: {
          status: "DELIVERED",
          items: {
            some: {
              variant: {
                productId: payload.productId,
              },
            },
          },
        },
      },
    },
  });
  if (!deliveredOrder) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Verified Purchase Required: You can only review products that have been delivered to you!",
    );
  }
  // ঘ. রিভিউ ডাটাবেজে সংরক্ষণ
  const newReview = await prisma.review.create({
    data: {
      userId,
      productId: payload.productId,
      rating: payload.rating,
      comment: payload.comment || null,
      images: payload.images || [],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
  return newReview;
};



// ২. নির্দিষ্ট প্রোডাক্টের সব রিভিউ দেখা (পাবলিক) + এভারেজ রেটিং সামারি
const getProductReviews = async (
  productId: string,
  paginationOptions: IPaginationOptions,
  filterOptions: IReviewFilterOptions,
) => {

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);
  
  const whereConditions: any = {
    productId,
  };

  if (filterOptions.rating) {
    whereConditions.rating = Number(filterOptions.rating);
  }

  // প্যারালাল কুয়েরি: রিভিউ লিস্ট, টোটাল কাউন্ট ও এগ্রিগেটেড রেটিং
  const [reviews, total, aggregateStats] = await Promise.all([
    prisma.review.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    }),
    prisma.review.count({ where: whereConditions }),
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      averageRating: Number((aggregateStats._avg.rating || 0).toFixed(1)),
      totalReviews: aggregateStats._count.rating || 0,
    },
    data: reviews,
  };
};


// ৩. কাস্টমারের নিজের দেওয়া সব রিভিউ দেখা
const getMyReviews = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
          },
        },
      },
    }),
    prisma.review.count({ where: { userId } }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: reviews,
  };
};


// ৪. রিভিউ আপডেট করা (শুধু যে রিভিউ লিখেছে সে পারবে)
const updateReview = async (
  userId: string,
  userRole: string,
  reviewId: string,
  payload: IUpdateReviewPayload,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found!');
  }
  if (
    userRole !== 'ADMIN' &&
    userRole !== 'SUPER_ADMIN' &&
    review.userId !== userId
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to edit this review!',
    );
  }
  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });
  return updatedReview;
};


// ৫. রিভিউ ডিলিট করা (রিভিউকারী বা অ্যাডমিন পারবে)
const deleteReview = async (
  userId: string,
  userRole: string,
  reviewId: string,
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found!');
  }
  if (
    userRole !== 'ADMIN' &&
    userRole !== 'SUPER_ADMIN' &&
    review.userId !== userId
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'You are not authorized to delete this review!',
    );
  }
  await prisma.review.delete({
    where: { id: reviewId },
  });
  return { message: 'Review deleted successfully!' };
};


export const ReviewService = {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};