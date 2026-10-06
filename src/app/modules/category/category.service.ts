import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICategoryCreateInput, ICategoryUpdateInput } from "./category.interface";
import httpStatus from 'http-status';


const toSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};



const createCategory = async (payload: ICategoryCreateInput) => {
  let slug = toSlug(payload.name);
  const existingSlug = await prisma.category.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (payload.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: payload.parentId },
    });
    if (!parent) {
      throw new AppError(httpStatus.NOT_FOUND, 'Parent category not found!');
    }
  }
  return await prisma.category.create({
    data: {
      name: payload.name,
      slug,
      icon: payload.icon,
      parentId: payload.parentId,
    },
  });
};


const getCategoryTree = async () => {
  return await prisma.category.findMany({
    where: { parentId: null }, 
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};



const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: true,
      products: { where: { isPublished: true } },
    },
  });
  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
  }
  return category;
};



const updateCategory = async (id: string, payload: ICategoryUpdateInput) => {
  const isExist = await prisma.category.findUnique({ where: { id } });
  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
  }
  return await prisma.category.update({
    where: { id },
    data: payload,
  });
};



const deleteCategory = async (id: string) => {
  const isExist = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found!');
  }
  if (isExist._count.products > 0 || isExist._count.children > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot delete category with associated products or subcategories!'
    );
  }
  return await prisma.category.delete({ where: { id } });
};


export const categoryService = {
  createCategory,
  getCategoryTree,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};