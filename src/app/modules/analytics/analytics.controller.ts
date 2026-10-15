import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { AnalyticsService } from './analytics.service';
import sendResponse from '../../utils/sendResponse';


const getAdminAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getAdminAnalytics();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin platform analytics retrieved successfully!',
    data: result,
  });
});


const getVendorAnalytics = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await AnalyticsService.getVendorAnalytics(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor store analytics retrieved successfully!',
    data: result,
  });
});


export const AnalyticsController = {
  getAdminAnalytics,
  getVendorAnalytics,
};