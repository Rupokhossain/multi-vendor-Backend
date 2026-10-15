import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { SystemSettingService } from './systemSetting.service';
import sendResponse from '../../utils/sendResponse';


const upsertSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemSettingService.upsertSetting(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'System setting saved successfully!',
    data: result,
  });
});

const getAllSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await SystemSettingService.getAllSettings();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'System settings retrieved successfully!',
    data: result,
  });
});

const getSettingByKey = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemSettingService.getSettingByKey(
    req.params.key as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'System setting details retrieved successfully!',
    data: result,
  });
});

const deleteSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemSettingService.deleteSetting(
    req.params.key as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const SystemSettingController = {
  upsertSetting,
  getAllSettings,
  getSettingByKey,
  deleteSetting,
};