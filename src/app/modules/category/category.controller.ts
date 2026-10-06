import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { categoryService } from './category.service';
import sendResponse from '../../utils/sendResponse';


const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully!',
    data: result,
  });
});

const getCategoryTree = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getCategoryTree();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category tree retrieved successfully!',
    data: result,
  });
});

const getCategoryBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await categoryService.getCategoryBySlug(slug as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category details retrieved successfully!',
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryService.updateCategory(id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category updated successfully!',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await categoryService.deleteCategory(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully!',
    data: result,
  });
});

export const categoryController = {
  createCategory,
  getCategoryTree,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};