import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { brandService } from './brand.service';
import sendResponse from '../../utils/sendResponse';


const createBrand = catchAsync(async (req: Request, res: Response) => {
  const result = await brandService.createBrand(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Brand created successfully!',
    data: result,
  });
});

const getAllBrands = catchAsync(async (req: Request, res: Response) => {
  const result = await brandService.getAllBrands();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brands retrieved successfully!',
    data: result,
  });
});

const getBrandBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await brandService.getBrandBySlug(slug as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brand details retrieved successfully!',
    data: result,
  });
});

const updateBrand = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await brandService.updateBrand(id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brand updated successfully!',
    data: result,
  });
});

const deleteBrand = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await brandService.deleteBrand(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Brand deleted successfully!',
    data: result,
  });
});

export const brandController = {
  createBrand,
  getAllBrands,
  getBrandBySlug,
  updateBrand,
  deleteBrand,
};