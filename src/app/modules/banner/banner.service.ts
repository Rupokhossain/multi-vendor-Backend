/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import httpStatus from 'http-status';
import { IBannerFilterOptions, ICreateBannerPayload, IUpdateBannerPayload } from './banner.interface';
import { prisma } from '../../lib/prisma';
import { IPaginationOptions } from '../../interface/pagination';
import { calculatePagination } from '../../utils/paginationHelper';
import { AppError } from '../../utils/AppError';

// ১. নতুন ব্যানার তৈরি করা (Admin only)
const createBanner = async (payload: ICreateBannerPayload) => {
  const banner = await prisma.banner.create({
    data: payload,
  });
  return banner;
};

// ২. হোমপেজের জন্য সক্রিয় ব্যানারসমূহ দেখা (Public)
const getActiveBanners = async (position?: string) => {

  const whereConditions: any = {
    isActive: true,
  };
  
  if (position) {
    whereConditions.position = position;
  }
  
  const banners = await prisma.banner.findMany({
    where: whereConditions,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return banners;
};

// ৩. সব ব্যানারের তালিকা দেখা (Admin Dashboard)
const getAllBanners = async (
  paginationOptions: IPaginationOptions,
  filterOptions: IBannerFilterOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const whereConditions: any = {};

  if (filterOptions.position) {
    whereConditions.position = filterOptions.position;
  }

  if (filterOptions.isActive !== undefined) {
    whereConditions.isActive = filterOptions.isActive === 'true';
  }
  
  if (filterOptions.searchTerm) {
    whereConditions.title = {
      contains: filterOptions.searchTerm,
      mode: 'insensitive',
    };
  }

  const [banners, total] = await Promise.all([
    prisma.banner.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.banner.count({ where: whereConditions }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: banners,
  };
};

// ৪. নির্দিষ্ট ব্যানার বিস্তারিত দেখা
const getBannerById = async (id: string) => {
  const banner = await prisma.banner.findUnique({
    where: { id },
  });
  if (!banner) {
    throw new AppError(httpStatus.NOT_FOUND, 'Banner not found!');
  }
  return banner;
};

// ৫. ব্যানার এডিট করা
const updateBanner = async (id: string, payload: IUpdateBannerPayload) => {
  const banner = await prisma.banner.findUnique({
    where: { id },
  });
  if (!banner) {
    throw new AppError(httpStatus.NOT_FOUND, 'Banner not found!');
  }
  const updated = await prisma.banner.update({
    where: { id },
    data: payload,
  });
  return updated;
};

// ৬. ব্যানার মুছে ফেলা
const deleteBanner = async (id: string) => {
  const banner = await prisma.banner.findUnique({
    where: { id },
  });
  if (!banner) {
    throw new AppError(httpStatus.NOT_FOUND, 'Banner not found!');
  }
  await prisma.banner.delete({
    where: { id },
  });
  return { message: 'Banner deleted successfully!' };
};


export const BannerService = {
  createBanner,
  getActiveBanners,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};