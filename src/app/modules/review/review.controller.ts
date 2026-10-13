import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewService } from './review.service';


const createReview = catchAsync(async (req: Request, res: Response) => {
  // ✅ id অথবা userId উভয়টিকেই নিখুঁতভাবে হ্যান্ডেল করা হলো
  const user = req.user as any;
  const userId = user?.id || user?.userId;

  const result = await ReviewService.createReview(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Review submitted successfully!',
    data: result,
  });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };

  const filterOptions = {
    rating: req.query.rating ? Number(req.query.rating) : undefined,
    searchTerm: req.query.searchTerm as string | undefined,
  };

  const result = await ReviewService.getProductReviews(
    req.params.productId as string,
    paginationOptions,
    filterOptions,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product reviews retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;

  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };

  const result = await ReviewService.getMyReviews(userId, paginationOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your reviews retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const userRole = user?.role;

  const result = await ReviewService.updateReview(
    userId,
    userRole,
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review updated successfully!',
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const userRole = user?.role;

  const result = await ReviewService.deleteReview(
    userId,
    userRole,
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const ReviewController = {
  createReview,
  getProductReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};