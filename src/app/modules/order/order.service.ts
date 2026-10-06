import {  Role, SubOrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ICreateOrderPayload, IUpdateSubOrderStatusPayload } from "./order.interface";
import httpStatus from "http-status";

// ১. মাস্টার অর্ডার তৈরি ও মাল্টি-ভেন্ডর স্প্লিটিং ইঞ্জিন
const createOrder = async (userId: string, payload: ICreateOrderPayload) => {
  const { shippingAddress, paymentMethod } = payload;
  return await prisma.$transaction(async (tx) => {
    // ক) আইটেম সংগ্রহ করা (যদি সরাসরি আইটেম না পাঠায়, তবে কার্ট থেকে আইটেম নেবে)
    let orderItemsToProcess: Array<{ variantId: string; quantity: number }> =
      [];
    if (payload.items && payload.items.length > 0) {
      orderItemsToProcess = payload.items;
    } else {
      const userCart = await tx.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      if (!userCart || userCart.items.length === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Your shopping cart is empty!",
        );
      }
      orderItemsToProcess = userCart.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));
    }
    // খ) ভ্যারিয়েন্ট, লাইভ স্টক এবং ভেন্ডর স্টোর তথ্য রিড করা
    const variantIds = orderItemsToProcess.map((item) => item.variantId);
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        product: {
          include: {
            store: true,
          },
        },
      },
    });
    if (variants.length !== orderItemsToProcess.length) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Some products in your order were not found!",
      );
    }
    // গ) স্টক ভ্যালিডেশন এবং ভেন্ডর অনুযায়ী গ্রুপিং
    const storeMap = new Map<
      string,
      {
        store: any;
        subTotal: number;
        items: Array<{ variantId: string; quantity: number; price: number }>;
      }
    >();
    let grandTotal = 0;
    for (const orderItem of orderItemsToProcess) {
      const variant = variants.find((v) => v.id === orderItem.variantId)!;
      // লাইভ স্টক চেক
      if (variant.stock < orderItem.quantity) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Product "${variant.product.title}" (${variant.sku}) is out of stock! Only ${variant.stock} available.`,
        );
      }
      const itemTotalPrice = variant.price * orderItem.quantity;
      grandTotal += itemTotalPrice;
      const store = variant.product.store;
      if (!storeMap.has(store.id)) {
        storeMap.set(store.id, {
          store,
          subTotal: 0,
          items: [],
        });
      }
      const storeGroup = storeMap.get(store.id)!;
      storeGroup.items.push({
        variantId: variant.id,
        quantity: orderItem.quantity,
        price: variant.price,
      });
      storeGroup.subTotal += itemTotalPrice;
      // স্টক কমিয়ে দেওয়া (Stock Decrement)
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { decrement: orderItem.quantity } },
      });
    }
    // ঘ) মাস্টার অর্ডার তৈরি (Parent Order)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const shippingAmount = 60.0; // ফ্ল্যাট রেট শিপিং
    const taxAmount = 0.0;
    const masterOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: userId,
        totalAmount: grandTotal + shippingAmount + taxAmount,
        shippingAmount,
        taxAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "PENDING" : "PAID",
        shippingAddress: shippingAddress as any,
      },
    });
    // ঙ) প্রতিটি ভেন্ডরের জন্য SubOrder তৈরি এবং কমিশন ক্যালকুলেশন
    const defaultPlatformCommissionRate = 10.0; // ডিফল্ট ১০% প্ল্যাটফর্ম কমিশন
    for (const [storeId, group] of storeMap.entries()) {
      const commissionRate =
        group.store.commissionRate ?? defaultPlatformCommissionRate;
      const platformFee = (group.subTotal * commissionRate) / 100;
      const vendorEarnings = group.subTotal - platformFee;
      await tx.subOrder.create({
        data: {
          orderId: masterOrder.id,
          storeId,
          subTotal: group.subTotal,
          platformFee,
          vendorEarnings,
          status: "PENDING",
          items: {
            create: group.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });
      // ভেন্ডরের পেন্ডিং ওয়ালেট ব্যালেন্সে টাকা যুক্ত করা
      await tx.store.update({
        where: { id: storeId },
        data: {
          pendingBalance: { increment: vendorEarnings },
        },
      });
    }
    // চ) কাস্টমারের কার্ট ফাঁকা করা (Clear Cart)
    const userCart = await tx.cart.findUnique({ where: { userId } });
    if (userCart) {
      await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
    }
    // ছ) সম্পূর্ণ অর্ডার ডাটা রিটার্ন করা
    return await tx.order.findUnique({
      where: { id: masterOrder.id },
      include: {
        subOrders: {
          include: {
            store: { select: { id: true, name: true, slug: true } },
            items: {
              include: {
                variant: {
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
                },
              },
            },
          },
        },
      },
    });
  });
};



// ২. কাস্টমার তার নিজের সমস্ত অর্ডার দেখবে
const getMyOrders = async (userId: string) => {
  const orders = await prisma.order.findMany({
    where: { customerId: userId },
    include: {
      subOrders: {
        include: {
          store: { select: { id: true, name: true, slug: true } },
          items: {
            include: {
              variant: {
                include: { product: { select: { id: true, title: true, slug: true, images: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return orders;
};



// ৩. ভেন্ডর তার নিজের স্টোরের SubOrder সমূহ দেখবে (Seller Dashboard)
const getVendorSubOrders = async (userId: string) => {
  const store = await prisma.store.findUnique({ where: { userId } });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, 'Vendor store not found!');
  }
  const subOrders = await prisma.subOrder.findMany({
    where: { storeId: store.id },
    include: {
      order: {
        select: {
          orderNumber: true,
          paymentMethod: true,
          paymentStatus: true,
          shippingAddress: true,
          createdAt: true,
        },
      },
      items: {
        include: {
          variant: {
            include: { product: { select: { id: true, title: true, slug: true, images: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return subOrders;
};



// ৪. ভেন্ডর তার SubOrder-এর স্ট্যাটাস আপডেট করবে (যেমন: Processing -> Shipped -> Delivered)
const updateSubOrderStatus = async (
  userId: string,
  userRole: string,
  subOrderId: string,
  payload: IUpdateSubOrderStatusPayload
) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { store: true },
  });
  if (!subOrder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Sub-order not found!');
  }
  // ভেন্ডর ওনারশিপ গার্ড (শুধুমাত্র নিজের স্টোরের অর্ডার আপডেট করতে পারবে)
  if (userRole !== Role.SUPER_ADMIN && subOrder.store.userId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You do not have permission to manage this sub-order!');
  }
  return await prisma.$transaction(async (tx) => {
    // 💵 ওয়ালেট আর্নিং ট্রানজিশন:
    // যদি অর্ডার DELIVERED হয়ে যায়, টাকা pendingBalance থেকে কেটে আসল walletBalance-এ চলে যাবে!
    if (payload.status === SubOrderStatus.DELIVERED && subOrder.status !== SubOrderStatus.DELIVERED) {
      await tx.store.update({
        where: { id: subOrder.storeId },
        data: {
          pendingBalance: { decrement: subOrder.vendorEarnings },
          walletBalance: { increment: subOrder.vendorEarnings },
        },
      });
    }
    const updatedSubOrder = await tx.subOrder.update({
      where: { id: subOrderId },
      data: {
        status: payload.status,
        trackingNumber: payload.trackingNumber ?? subOrder.trackingNumber,
      },
    });
    return updatedSubOrder;
  });
};


export const orderService = {
  createOrder,
  getMyOrders,
  getVendorSubOrders,
  updateSubOrderStatus,
};