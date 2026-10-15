/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { AddressService } from "./address.service";
import sendResponse from "../../utils/sendResponse";


const createAddress = catchAsync(async (req: Request, res: Response) => {
  
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await AddressService.createAddress(userId, req.body);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Address saved successfully!",
    data: result,
  });
});



const getMyAddresses = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await AddressService.getMyAddresses(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Saved addresses retrieved successfully!',
    data: result,
  });
});


const getAddressById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const userRole = user?.role;
  const result = await AddressService.getAddressById(
    userId,
    userRole,
    req.params.id as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Address details retrieved successfully!',
    data: result,
  });
});



const updateAddress = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const userRole = user?.role;
  const result = await AddressService.updateAddress(
    userId,
    userRole,
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Address updated successfully!',
    data: result,
  });
});



const setDefaultAddress = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await AddressService.setDefaultAddress(
    userId,
    req.params.id as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Default address updated successfully!',
    data: result,
  });
});

const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const userRole = user?.role;
  const result = await AddressService.deleteAddress(
    userId,
    userRole,
    req.params.id as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const AddressController = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};