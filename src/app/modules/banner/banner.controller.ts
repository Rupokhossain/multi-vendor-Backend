import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { BannerService } from './banner.service';
import sendResponse from '../../utils/sendResponse';

const createBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.createBanner(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Banner created successfully!',
    data: result,
  });
});

const getActiveBanners = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getActiveBanners(
    req.query.position as string | undefined,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active promotional banners retrieved successfully!',
    data: result,
  });
});

const getAllBanners = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
  };

  const filterOptions = {
    position: req.query.position as string | undefined,
    isActive: req.query.isActive as string | undefined,
    searchTerm: req.query.searchTerm as string | undefined,
  };

  const result = await BannerService.getAllBanners(
    paginationOptions,
    filterOptions,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All banners retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getBannerById = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.getBannerById(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner details retrieved successfully!',
    data: result,
  });
});

const updateBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.updateBanner(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Banner updated successfully!',
    data: result,
  });
});

const deleteBanner = catchAsync(async (req: Request, res: Response) => {
  const result = await BannerService.deleteBanner(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const BannerController = {
  createBanner,
  getActiveBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};