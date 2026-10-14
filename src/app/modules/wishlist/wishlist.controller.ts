/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { WishlistService } from './wishlist.service';
import sendResponse from '../../utils/sendResponse';

const toggleWishlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await WishlistService.toggleWishlist(
    userId,
    req.body.productId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data || null,
  });
});


const getMyWishlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };
  const result = await WishlistService.getMyWishlist(
    userId,
    paginationOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Wishlist retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});


const removeFromWishlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await WishlistService.removeFromWishlist(
    userId,
    req.params.productId as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});



const clearWishlist = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await WishlistService.clearWishlist(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});


export const WishlistController = {
  toggleWishlist,
  getMyWishlist,
  removeFromWishlist,
  clearWishlist,
};