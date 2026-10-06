import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { productService } from './product.service';
import sendResponse from '../../utils/sendResponse';


const createProduct = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await productService.createProduct(user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Product created successfully with variants!',
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    categoryId: req.query.categoryId as string,
    brandId: req.query.brandId as string,
    storeId: req.query.storeId as string,
  };

  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
  };

  const result = await productService.getAllProducts(filters, paginationOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Products retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await productService.getProductBySlug(slug as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product retrieved successfully!',
    data: result,
  });
});

const getMyStoreProducts = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const paginationOptions = {
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
  };

  const result = await productService.getMyStoreProducts(user.userId, paginationOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Store products retrieved successfully!',
    meta: result.meta,
    data: result.data,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const result = await productService.updateProduct(user.userId, id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product updated successfully!',
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const result = await productService.deleteProduct(user.userId, user.role, id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const productController = {
  createProduct,
  getAllProducts,
  getProductBySlug,
  getMyStoreProducts,
  updateProduct,
  deleteProduct,
};