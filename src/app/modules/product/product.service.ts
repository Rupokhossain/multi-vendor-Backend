import { Prisma } from "../../../generated/prisma/client";
import { IPaginationOptions } from "../../interface/pagination";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { calculatePagination } from "../../utils/paginationHelper";
import {
  ICreateProductPayload,
  IProductFilterRequest,
  IUpdateProductPayload,
} from "./product.interface";
import httpStatus from "http-status";

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ১. ভেন্ডর প্রোডাক্ট তৈরি করবে (প্রোডাক্ট + একাধিক ভ্যারিয়েন্ট একসাথে ট্রানজেকশনে)
const createProduct = async (
  userId: string,
  payload: ICreateProductPayload,
) => {
  // ক) ইউজারের স্টোর আছে কিনা যাচাই
  const store = await prisma.store.findUnique({
    where: { userId },
  });

  if (!store) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Store not found! Please create a store first.",
    );
  }

  // খ) ক্যাটাগরি আসল কিনা যাচাই
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Selected category does not exist!",
    );
  }

  // গ) ব্র্যান্ড দেওয়া থাকলে তা যাচাই
  if (payload.brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: payload.brandId },
    });

    if (!brand) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Selected brand does not exist!",
      );
    }
  }

  // ঘ) ইউনিক স্লাগ তৈরি
  let slug = generateSlug(payload.title);
  const isSlugExist = await prisma.product.findUnique({ where: { slug } });

  if (isSlugExist) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // ঙ) SKU ডুপ্লিকেট কিনা যাচাই
  const skus = payload.variants.map((v) => v.sku);
  const existingSkus = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
  });

  if (existingSkus.length > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `SKU already exists: ${existingSkus.map((item) => item.sku).join(", ")}`,
    );
  }
  // চ) অ্যাটোমিক ট্রানজেকশন (প্রোডাক্ট + ভ্যারিয়েন্ট একসাথে তৈরি)
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        storeId: store.id,
        title: payload.title,
        slug,
        description: payload.description,
        categoryId: payload.categoryId,
        brandId: payload.brandId,
        images: payload.images,
        isPublished: payload.isPublished ?? true,
      },
    });
    const variantData = payload.variants.map((variant) => ({
      productId: product.id,
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      attributes: variant.attributes,
    }));
    await tx.productVariant.createMany({
      data: variantData,
    });
    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        variants: true,
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        store: { select: { id: true, name: true, slug: true, logo: true } },
      },
    });
  });
  return result;
};

// ২. সকল প্রোডাক্ট ফিল্টারিং ও পেজিনেশন সহ (পাবলিক ক্যাটালগ)
const getAllProducts = async (
  filters: IProductFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const { searchTerm, categoryId, brandId, storeId } = filters;
  const andConditions: Prisma.ProductWhereInput[] = [{ isPublished: true }];
  if (searchTerm) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }
  if (categoryId) andConditions.push({ categoryId });
  if (brandId) andConditions.push({ brandId });
  if (storeId) andConditions.push({ storeId });
  const whereConditions: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        variants: true,
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        store: { select: { id: true, name: true, slug: true, logo: true } },
      },
    }),
    prisma.product.count({ where: whereConditions }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: products,
  };
};

// ৩. স্লাগ দিয়ে সিঙ্গেল প্রোডাক্ট ডিটেইলস (পাবলিক ভিউ)
const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      variants: true,
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      store: { select: { id: true, name: true, slug: true, logo: true } },
    },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, "Product not found!");
  }
  return product;
};

// ৪. ভেন্ডরের নিজস্ব সব প্রোডাক্ট (ভেন্ডর ড্যাশবোর্ডের জন্য)
const getMyStoreProducts = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const store = await prisma.store.findUnique({ where: { userId } });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, "Store not found!");
  }
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { storeId: store.id },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { variants: true, category: true, brand: true },
    }),
    prisma.product.count({ where: { storeId: store.id } }),
  ]);
  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: products,
  };
};

// ৫. প্রোডাক্ট আপডেট (ভেন্ডর শুধু তার নিজের প্রোডাক্ট এডিট করতে পারবে)
const updateProduct = async (
  userId: string,
  productId: string,
  payload: IUpdateProductPayload,
) => {
  const store = await prisma.store.findUnique({ where: { userId } });
  if (!store) throw new AppError(httpStatus.NOT_FOUND, "Store not found!");
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found!");
  if (product.storeId !== store.id) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update your own products!",
    );
  }
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: payload,
    include: { variants: true },
  });
  return updatedProduct;
};

// ৬. প্রোডাক্ট ডিলিট
const deleteProduct = async (
  userId: string,
  userRole: string,
  productId: string,
) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found!");
  // সুপার অ্যাডমিন যেকোনো প্রোডাক্ট মুছতে পারবে, কিন্তু ভেন্ডর শুধু নিজের স্টোরের প্রোডাক্ট মুছতে পারবে
  if (userRole !== "SUPER_ADMIN") {
    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store || product.storeId !== store.id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to delete this product!",
      );
    }
  }
  await prisma.product.delete({ where: { id: productId } });
  return { message: "Product deleted successfully" };
};


export const productService = {
  createProduct,
  getAllProducts,
  getProductBySlug,
  getMyStoreProducts,
  updateProduct,
  deleteProduct,
};
