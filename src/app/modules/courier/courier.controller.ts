import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { courierService } from './courier.service';


const bookShipment = catchAsync(async (req: Request, res: Response) => {
  const { subOrderId } = req.params;
  const user = req.user;

  const result = await courierService.bookShipment(subOrderId as string, user as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shipment booked successfully with Steadfast Courier!',
    data: result,
  });
});

const trackShipment = catchAsync(async (req: Request, res: Response) => {
  const { subOrderId } = req.params;

  const result = await courierService.trackShipment(subOrderId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Live courier tracking details retrieved!',
    data: result,
  });
});

const confirmDelivery = catchAsync(async (req: Request, res: Response) => {
  const { subOrderId } = req.params;

  const result = await courierService.confirmDelivery(subOrderId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Parcel marked as DELIVERED & vendor earnings released to wallet!',
    data: result,
  });
});

export const courierController = {
  bookShipment,
  trackShipment,
  confirmDelivery,
};