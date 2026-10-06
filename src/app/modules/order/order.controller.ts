import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { orderService } from './order.service';
import sendResponse from '../../utils/sendResponse';

const createOrder = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await orderService.createOrder(user.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Order placed successfully and split across vendors!',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await orderService.getMyOrders(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My orders retrieved successfully!',
    data: result,
  });
});

const getVendorSubOrders = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const result = await orderService.getVendorSubOrders(user.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Vendor sub-orders retrieved successfully!',
    data: result,
  });
});

const updateSubOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const result = await orderService.updateSubOrderStatus(user.userId, user.role, id as string, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Sub-order status updated successfully!',
    data: result,
  });
});

export const orderController = {
  createOrder,
  getMyOrders,
  getVendorSubOrders,
  updateSubOrderStatus,
};