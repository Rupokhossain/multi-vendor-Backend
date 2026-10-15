import httpStatus from 'http-status';
import { ISystemSettingPayload } from './systemSetting.interface';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';


// ১. সেটিং সেভ বা আপডেট করা (Upsert)
const upsertSetting = async (payload: ISystemSettingPayload) => {
  const key = payload.key.toUpperCase().trim();

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: payload.value,
      description: payload.description || null,
    },
    update: {
      value: payload.value,
      description: payload.description || undefined,
    },
  });

  return setting;
};

// ২. সব সেটিংস একসাথে দেখা (পাবলিক / ড্যাশবোর্ড)
const getAllSettings = async () => {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  });

  // অবজেক্ট ডিকশনারি আকারে রিটার্ন করা (Frontend-এর ব্যবহারের সুবিধার জন্য)
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return {
    raw: settings,
    dictionary: settingsMap,
  };
};

// ৩. নির্দিষ্ট কি (Key) অনুযায়ী সেটিং মান বের করা
const getSettingByKey = async (key: string) => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: key.toUpperCase().trim() },
  });

  if (!setting) {
    throw new AppError(httpStatus.NOT_FOUND, 'Setting not found!');
  }

  return setting;
};

// ৪. সেটিং ডিলিট করা
const deleteSetting = async (key: string) => {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: key.toUpperCase().trim() },
  });

  if (!setting) {
    throw new AppError(httpStatus.NOT_FOUND, 'Setting not found!');
  }

  await prisma.systemSetting.delete({
    where: { key: key.toUpperCase().trim() },
  });

  return { message: 'Setting deleted successfully!' };
};

export const SystemSettingService = {
  upsertSetting,
  getAllSettings,
  getSettingByKey,
  deleteSetting,
};