import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { storeService } from './store.service';

const createStore = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await storeService.createStore(user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Store created successfully! Pending admin approval.',
    data: result,
  });
});

const getMyStore = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await storeService.getMyStore(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Your store profile retrieved successfully!',
    data: result,
  });
});

const updateMyStore = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await storeService.updateMyStore(user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Store updated successfully!',
    data: result,
  });
});

const getStoreBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await storeService.getStoreBySlug(slug as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Store details retrieved successfully!',
    data: result,
  });
});

const getAllStores = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    verificationStatus: req.query.verificationStatus as any,
  };
  const options = {
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as any,
  };

  const result = await storeService.getAllStores(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All stores retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateStoreStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await storeService.updateStoreStatus(id as string, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Store verification status updated to ${status}!`,
    data: result,
  });
});

export const storeController = {
  createStore,
  getMyStore,
  updateMyStore,
  getStoreBySlug,
  getAllStores,
  updateStoreStatus,
};