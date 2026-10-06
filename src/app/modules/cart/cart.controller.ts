import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { cartService } from './cart.service';
import sendResponse from '../../utils/sendResponse';

const getMyCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await cartService.getMyCart(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart retrieved successfully!',
    data: result,
  });
});

const addToCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await cartService.addToCart(user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Item added to cart successfully!',
    data: result,
  });
});

const updateCartItemQuantity = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const result = await cartService.updateCartItemQuantity(user.userId, id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cart item updated successfully!',
    data: result,
  });
});

const removeCartItem = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const result = await cartService.removeCartItem(user.userId, id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

const clearCart = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await cartService.clearCart(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const cartController = {
  getMyCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};