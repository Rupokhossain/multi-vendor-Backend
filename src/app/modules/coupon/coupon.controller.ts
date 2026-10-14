/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { CouponService } from './coupon.service';
import sendResponse from '../../utils/sendResponse';


const createCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.createCoupon(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Coupon created successfully!',
    data: result,
  });
});


const applyCoupon = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await CouponService.applyCoupon(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon applied successfully!',
    data: result,
  });
});


const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };
  const filterOptions = {
    searchTerm: req.query.searchTerm as string | undefined,
    isActive: req.query.isActive as string | undefined,
  };
  const result = await CouponService.getAllCoupons(
    paginationOptions,
    filterOptions,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupons retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});


const getActiveCoupons = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getActiveCoupons();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active promotional coupons retrieved successfully!',
    data: result,
  });
});


const getCouponById = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.getCouponById(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon details retrieved successfully!',
    data: result,
  });
});

const updateCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.updateCoupon(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Coupon updated successfully!',
    data: result,
  });
});


const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
  const result = await CouponService.deleteCoupon(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const CouponController = {
  createCoupon,
  applyCoupon,
  getAllCoupons,
  getActiveCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
};