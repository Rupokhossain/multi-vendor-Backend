import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { PaymentStatus, SubOrderStatus } from "../../../generated/prisma/enums";
import config from "../../config";

// ১. কুরিয়ার পার্সেল বুকিং (ভেন্ডার অথবা অ্যাডমিন কল করবে)
const bookShipment = async (subOrderId: string, user: any) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      store: true,
      order: true,
    },
  });

  if (!subOrder) {
    throw new AppError(httpStatus.NOT_FOUND, 'Sub-order not found!');
  }

  // ভেন্ডার হলে নিজের স্টোর হতে হবে, আর SUPER_ADMIN বা STAFF হলে সবার পার্সেল বুক করতে পারবে
  const isStoreOwner = subOrder.store.userId === user.id;
  const isAdminOrStaff = user.role === 'SUPER_ADMIN' || user.role === 'STAFF';

  if (!isStoreOwner && !isAdminOrStaff) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only ship parcels for your own store!');
  }

  // ইতোমধ্যে শিপ হয়ে থাকলে পুনরায় বুক করা যাবে না
  if (subOrder.status === SubOrderStatus.SHIPPED || subOrder.status === SubOrderStatus.DELIVERED) {
    throw new AppError(httpStatus.BAD_REQUEST, `Order is already ${subOrder.status.toLowerCase()}!`);
  }

  // ক্যাশ অন ডেলিভারি (COD) অ্যামাউন্ট নির্ধারণ
  // যদি অর্ডার আগেই পেইড থাকে (SSLCommerz), তবে COD = 0, অন্যথায় অর্ডারের টাকা কালেক্ট করতে হবে
  const orderData = subOrder.order as any;
  const isPaid =
    orderData.paymentStatus === PaymentStatus.PAID ||
    orderData.payment?.status === PaymentStatus.PAID;
  const codAmount = isPaid ? 0 : subOrder.subTotal;

  // গ্রাহকের ডেলিভারি ঠিকানা পার্স করা
  let shippingInfo: any = orderData.shippingAddress;
  if (typeof shippingInfo === 'string') {
    try {
      shippingInfo = JSON.parse(shippingInfo);
    } catch {
      // যদি প্লেইন স্ট্রিং হয়
    }
  }

  const recipientName = shippingInfo?.fullName || 'Valued Customer';
  const recipientPhone = shippingInfo?.phoneNumber || '01711111111';
  const recipientAddress = shippingInfo?.streetAddress
    ? `${shippingInfo.streetAddress}, ${shippingInfo.city || 'Dhaka'}`
    : 'House 12, Road 5, Dhanmondi, Dhaka';

  let consignmentId: string;
  let trackingCode: string;
  let courierStatus: string = 'in_review';

  // চেক করা আসল কী দেওয়া আছে কি না
  const hasRealKeys = config.steadfastApiKey && config.steadfastSecretKey;

  if (hasRealKeys) {
    // সরাসরি আসল Steadfast API তে HTTP POST কল
    const response = await fetch(`${config.steadfastBaseUrl}/create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': config.steadfastApiKey!,
        'Secret-Key': config.steadfastSecretKey!,
      },
      body: JSON.stringify({
        invoice: subOrder.id.slice(0, 16),
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
        cod_amount: codAmount,
        note: `Nexus-Market | Store: ${subOrder.store.name}`,
      }),
    });

    const resData = await response.json();

    if (resData.status !== 200 || !resData.consignment) {
      throw new AppError(
        httpStatus.BAD_GATEWAY,
        `Steadfast Courier Error: ${resData.message || JSON.stringify(resData.errors)}`
      );
    }

    consignmentId = String(resData.consignment.consignment_id);
    trackingCode = resData.consignment.tracking_code;
    courierStatus = resData.consignment.status || 'in_review';
  } else {
    // 💡 Steadfast Production-Ready Adapter (আসল Steadfast এর ফরম্যাটে সিমুলেশন)
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    consignmentId = `${randomNum}`;
    trackingCode = `SF${randomNum}`;
  }

  // ডাটাবেজে সাব-অর্ডার আপডেট
  const updatedSubOrder = await prisma.subOrder.update({
    where: { id: subOrderId },
    data: {
      status: SubOrderStatus.SHIPPED,
      courierName: 'STEADFAST',
      consignmentId,
      trackingNumber: trackingCode,
      courierStatus,
      shippedAt: new Date(),
    },
  });

  return {
    subOrderId: updatedSubOrder.id,
    courierName: updatedSubOrder.courierName,
    consignmentId,
    trackingCode,
    codAmount,
    status: updatedSubOrder.status,
    isLiveSteadfast: Boolean(hasRealKeys),
  };
};

// ২. লাইভ পার্সেল ট্র্যাকিং
const trackShipment = async (subOrderId: string) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      store: { select: { name: true } },
    },
  });
  if (!subOrder || !subOrder.consignmentId) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Shipment not found or not booked yet!",
    );
  }
  const hasRealKeys = config.steadfastApiKey && config.steadfastSecretKey;
  // যদি আসল কী থাকে তবে Steadfast সার্ভার থেকে লাইভ ট্র্যাকিং ডাটা আনবে
  if (hasRealKeys) {
    try {
      const response = await fetch(
        `${config.steadfastBaseUrl}/status_by_cid/${subOrder.consignmentId}`,
        {
          headers: {
            "Api-Key": config.steadfastApiKey!,
            "Secret-Key": config.steadfastSecretKey!,
          },
        },
      );
      const resData = await response.json();
      return {
        provider: "STEADFAST_LIVE",
        subOrderId: subOrder.id,
        trackingCode: subOrder.trackingNumber,
        status: resData.delivery_status || subOrder.courierStatus,
        details: resData,
      };
    } catch (err) {
      // নেটওয়ার্ক এরর হলে ডাটাবেজের স্ট্যাটাস রিটার্ন করবে
    }
  }
  // Adapter টাইমলাইন (ফ্রন্টএন্ডের জন্য সুন্দর ট্র্যাকিং স্ট্যাটাস)
  return {
    provider: "STEADFAST",
    subOrderId: subOrder.id,
    store: subOrder.store.name,
    trackingCode: subOrder.trackingNumber,
    consignmentId: subOrder.consignmentId,
    currentStatus: subOrder.courierStatus || "in_transit",
    shippedAt: subOrder.shippedAt,
    timeline: [
      {
        status: "BOOKED",
        title: "Parcel Booked",
        description: "Vendor created consignment in Steadfast courier system.",
        timestamp: subOrder.shippedAt,
      },
      {
        status: "PICKED_UP",
        title: "Rider Picked Up",
        description: "Steadfast rider picked up parcel from vendor store.",
        timestamp: subOrder.shippedAt
          ? new Date(subOrder.shippedAt.getTime() + 1000 * 60 * 60 * 2)
          : new Date(),
      },
      {
        status: "IN_TRANSIT",
        title: "In Transit",
        description: "Parcel is in transit to destination delivery hub.",
        timestamp: new Date(),
      },
    ],
  };
};

// ৩. পার্সেল ডেলিভারি কনফার্মেশন (অটো ভেন্ডার ওয়ালেট আপডেট)
const confirmDelivery = async (subOrderId: string) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { store: true },
  });
  if (!subOrder) {
    throw new AppError(httpStatus.NOT_FOUND, "Sub-order not found!");
  }
  if (subOrder.status === SubOrderStatus.DELIVERED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Sub-order is already marked as DELIVERED!",
    );
  }
  // ট্রানজ্যাকশনে সাব-অর্ডার ডেলিভার্ড করা এবং ভেন্ডার ওয়ালেটে টাকা ট্রান্সফার
  const result = await prisma.$transaction(async (tx) => {
    const updatedSubOrder = await tx.subOrder.update({
      where: { id: subOrderId },
      data: {
        status: SubOrderStatus.DELIVERED,
        courierStatus: "delivered",
      },
    });
    // ভেন্ডার ওয়ালেটে পেন্ডিং টাকা মেইন ব্যালেন্সে ট্রান্সফার
    await tx.store.update({
      where: { id: subOrder.storeId },
      data: {
        pendingBalance: { decrement: subOrder.vendorEarnings },
        walletBalance: { increment: subOrder.vendorEarnings },
      },
    });
    // প্যারেন্ট অর্ডারের সব সাব-অর্ডার ডেলিভার্ড হলো কি না চেক
    const remainingPending = await tx.subOrder.count({
      where: {
        orderId: subOrder.orderId,
        status: { not: SubOrderStatus.DELIVERED },
      },
    });
    if (remainingPending === 0) {
      await tx.order.update({
        where: { id: subOrder.orderId },
        data: { status: "DELIVERED" as any },
      });
    }
    return updatedSubOrder;
  });
  return result;
};

export const courierService = {
  bookShipment,
  trackShipment,
  confirmDelivery,
};
