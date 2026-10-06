import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { IAddToCartPayload, IUpdateCartItemPayload } from "./cart.interface";
import httpStatus from 'http-status';


// ১. কাস্টমারের কার্ট নিয়ে আসা (স্টোরভিত্তিক গ্রুপড ডাটা সহ)
const getMyCart = async (userId: string) => {
  // কার্ট না থাকলে স্বয়ংক্রিয়ভাবে একটি খালি কার্ট তৈরি করে নেওয়া
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  store: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      logo: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    store: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }
  // 🏪 মাল্টি-ভেন্ডর ম্যাজিক: ভেন্ডর/স্টোর অনুযায়ী আইটেম গ্রুপিং
  const storeMap = new Map();
  let totalAmount = 0;
  let totalItems = 0;
  for (const item of cart.items) {
    const store = item.variant.product.store;
    const itemTotal = item.variant.price * item.quantity;
    totalAmount += itemTotal;
    totalItems += item.quantity;
    if (!storeMap.has(store.id)) {
      storeMap.set(store.id, {
        store,
        storeSubTotal: 0,
        items: [],
      });
    }
    const group = storeMap.get(store.id);
    group.items.push({
      id: item.id,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.variant.price,
      totalPrice: itemTotal,
      variant: {
        sku: item.variant.sku,
        stock: item.variant.stock,
        attributes: item.variant.attributes,
        product: {
          id: item.variant.product.id,
          title: item.variant.product.title,
          slug: item.variant.product.slug,
          images: item.variant.product.images,
        },
      },
    });
    group.storeSubTotal += itemTotal;
  }
  return {
    cartId: cart.id,
    totalItems,
    totalAmount,
    stores: Array.from(storeMap.values()),
  };
};


// ২. কার্টে প্রোডাক্ট ভ্যারিয়েন্ট যোগ করা (লাইভ স্টক চেক সহ)
const addToCart = async (userId: string, payload: IAddToCartPayload) => {
  // ক) ভ্যারিয়েন্ট ও লাইভ স্টক যাচাই
  const variant = await prisma.productVariant.findUnique({
    where: { id: payload.variantId },
    include: { product: true },
  });
  if (!variant) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product variant not found!');
  }
  if (!variant.product.isPublished) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Product is not available for purchase!');
  }
  if (variant.stock < payload.quantity) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Insufficient stock! Only ${variant.stock} items available.`
    );
  }
  // খ) ইউজার কার্ট নিশ্চিত করা
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  // গ) এই ভ্যারিয়েন্ট কি কার্টে ইতিমধ্যে আছে?
// ✅ সঠিক এবং ক্লিন সমাধান
const existingCartItem = await prisma.cartItem.findFirst({
  where: {
    cartId: cart.id,
    variantId: payload.variantId,
  },
});
  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + payload.quantity;
    if (variant.stock < newQuantity) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot add more! You already have ${existingCartItem.quantity} in cart and only ${variant.stock} are in stock.`
      );
    }
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
    });
    return updatedItem;
  }
  // ঘ) নতুন আইটেম হিসেবে কার্টে যোগ করা
  const newItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      variantId: payload.variantId,
      quantity: payload.quantity,
    },
  });
  return newItem;
};



// ৩. কার্টের নির্দিষ্ট আইটেমের পরিমাণ (Quantity) আপডেট করা
const updateCartItemQuantity = async (
  userId: string,
  itemId: string,
  payload: IUpdateCartItemPayload
) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      cart: true,
      variant: true,
    },
  });
  if (!cartItem) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart item not found!');
  }
  if (cartItem.cart.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You do not own this cart item!');
  }
  if (cartItem.variant.stock < payload.quantity) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot set quantity to ${payload.quantity}. Only ${cartItem.variant.stock} items in stock!`
    );
  }
  const updatedItem = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: payload.quantity },
  });
  return updatedItem;
};


// ৪. কার্ট থেকে নির্দিষ্ট আইটেম মুছে ফেলা
const removeCartItem = async (userId: string, itemId: string) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!cartItem) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart item not found!');
  }
  if (cartItem.cart.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You do not own this cart item!');
  }
  await prisma.cartItem.delete({ where: { id: itemId } });
  return { message: 'Item removed from cart successfully' };
};


// ৫. পুরো কার্ট এক ক্লিকে খালি করা
const clearCart = async (userId: string) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
  return { message: 'Cart cleared successfully' };
};


export const cartService = {
  getMyCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};