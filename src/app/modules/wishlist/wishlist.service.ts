import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/AppError';
import { calculatePagination } from '../../utils/paginationHelper';
import { IPaginationOptions } from '../../interface/pagination';

const toggleWishlist = async (userId: string, productId: string) => {
  // ক. প্রোডাক্টটি ডাটাবেজে আছে কি না চেক
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found!');
  }
  // খ. ইউজারের উইশলিস্ট খুঁজে বের করা (না থাকলে তৈরি করা)
  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId },
    });
  }
  // গ. এই প্রোডাক্টটি ইতোমধ্যে উইশলিস্টে আছে কি না চেক
  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId,
    },
  });
  // ঘ. যদি থাকে: উইশলিস্ট থেকে রিমুভ করব (Unlike)
  if (existingItem) {
    await prisma.wishlistItem.delete({
      where: { id: existingItem.id },
    });
    return {
      isAdded: false,
      message: 'Product removed from your wishlist!',
    };
  }
  // ঙ. যদি না থাকে: উইশলিস্টে যোগ করব (Like)
  const newItem = await prisma.wishlistItem.create({
    data: {
      wishlistId: wishlist.id,
      productId,
    },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          images: true,
        },
      },
    },
  });
  return {
    isAdded: true,
    message: 'Product added to your wishlist!',
    data: newItem,
  };
};



const getMyWishlist = async (
  userId: string,
  paginationOptions: IPaginationOptions,
) => {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });
  if (!wishlist) {
    return {
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPage: 0,
      },
      data: [],
    };
  }
  const { page, limit, skip, sortBy, sortOrder } =
    calculatePagination(paginationOptions);
  const [items, total] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { wishlistId: wishlist.id },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            isPublished: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
            brand: {
              select: { id: true, name: true, slug: true },
            },
            variants: {
              select: {
                id: true,
                sku: true,
                price: true,
                discountPrice: true,
                stock: true,
              },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } }),
  ]);
  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: items,
  };
};


const removeFromWishlist = async (userId: string, productId: string) => {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });
  if (!wishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Wishlist not found!');
  }
  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId,
    },
  });
  if (!existingItem) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Product is not in your wishlist!',
    );
  }
  await prisma.wishlistItem.delete({
    where: { id: existingItem.id },
  });
  return { message: 'Product removed from wishlist successfully!' };
};


const clearWishlist = async (userId: string) => {
  const wishlist = await prisma.wishlist.findUnique({
    where: { userId },
  });
  if (!wishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Wishlist not found!');
  }
  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id },
  });
  return { message: 'Wishlist cleared successfully!' };
};


export const WishlistService = {
  toggleWishlist,
  getMyWishlist,
  removeFromWishlist,
  clearWishlist,
};