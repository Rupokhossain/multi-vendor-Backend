/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { PayoutService } from './payout.service';
import sendResponse from '../../utils/sendResponse';


const createPayoutRequest = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;

  const result = await PayoutService.createPayoutRequest(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Payout request submitted successfully!',
    data: result,
  });
});

const getMyPayoutRequests = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;

  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };

  const result = await PayoutService.getMyPayoutRequests(
    userId,
    paginationOptions,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your payout requests retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getAllPayoutRequests = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };

  const filterOptions = {
    status: req.query.status as string | undefined,
  };

  const result = await PayoutService.getAllPayoutRequests(
    paginationOptions,
    filterOptions,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All payout requests retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updatePayoutStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await PayoutService.updatePayoutStatus(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Payout request ${req.body.status.toLowerCase()} successfully!`,
    data: result,
  });
});

const getVendorPayoutStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;

  const result = await PayoutService.getVendorPayoutStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Wallet and payout stats retrieved successfully!',
    data: result,
  });
});

export const PayoutController = {
  createPayoutRequest,
  getMyPayoutRequests,
  getAllPayoutRequests,
  updatePayoutStatus,
  getVendorPayoutStats,
};