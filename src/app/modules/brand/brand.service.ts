import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IBrandCreateInput, IBrandUpdateInput } from "./brand.interface";
import httpStatus from 'http-status';


const toSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};


const createBrand = async (payload: IBrandCreateInput) => {
  let slug = toSlug(payload.name);
  const isExist = await prisma.brand.findUnique({ where: { slug } });
  if (isExist) {
    throw new AppError(httpStatus.CONFLICT, 'Brand with this name already exists!');
  }
  return await prisma.brand.create({
    data: {
      name: payload.name,
      slug,
      logo: payload.logo,
    },
  });
};


const getAllBrands = async () => {
  return await prisma.brand.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  });
};


const getBrandBySlug = async (slug: string) => {
  const brand = await prisma.brand.findUnique({
    where: { slug },
    include: { products: { where: { isPublished: true } } },
  });
  if (!brand) {
    throw new AppError(httpStatus.NOT_FOUND, 'Brand not found!');
  }
  return brand;
};


const updateBrand = async (id: string, payload: IBrandUpdateInput) => {
  const isExist = await prisma.brand.findUnique({ where: { id } });
  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Brand not found!');
  }
  return await prisma.brand.update({
    where: { id },
    data: payload,
  });
};


const deleteBrand = async (id: string) => {
  const isExist = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Brand not found!');
  }
  if (isExist._count.products > 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cannot delete brand with associated products!');
  }
  return await prisma.brand.delete({ where: { id } });
};
export const brandService = {
  createBrand,
  getAllBrands,
  getBrandBySlug,
  updateBrand,
  deleteBrand,
};