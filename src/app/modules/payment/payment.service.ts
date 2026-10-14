import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import config from "../../config";
import { ISSLCommerzCallback } from "./payment.interface";

const initiatePayment = async (
  userId: string,
  userRole: string,
  orderId: string,
) => {
  // ক. অর্ডারটি খুঁজে বের করা ও অথরাইজেশন যাচাই
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, "Order not found!");
  }

  if (
    order.customerId !== userId &&
    userRole !== "ADMIN" &&
    userRole !== "SUPER_ADMIN"
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to pay for this order!",
    );
  }
  if (order.paymentStatus === "PAID") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This order is already paid for!",
    );
  }

  // খ. ইউনিক ট্রানজ্যাকশন আইডি জেনারেট করা
  const transactionId = `TXN-${Date.now()}-${order.orderNumber.replace(/[^a-zA-Z0-9]/g, "")}`;

  // গ. ডাটাবেজে Payment রেকর্ড তৈরি বা আপডেট (Upsert)
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      transactionId,
      amount: order.totalAmount,
      method: "SSLCOMMERZ",
      status: "PENDING",
    },
    update: {
      transactionId,
      amount: order.totalAmount,
      method: "SSLCOMMERZ",
      status: "PENDING",
    },
  });

 
    // ঘ. SSLCommerz-এর রিকোয়েস্ট বডি তৈরি
  const shipping = order.shippingAddress as any;

  const sslPayload = new URLSearchParams({
    store_id: config.storeId || 'testbox',
    store_passwd: config.storePasswd || 'qwerty',
    total_amount: order.totalAmount.toString(),
    currency: 'BDT',
    tran_id: transactionId,
    success_url: config.successUrl || 'http://localhost:5000/api/v1/payments/sslcommerz/success',
    fail_url: config.failUrl || 'http://localhost:5000/api/v1/payments/sslcommerz/fail',
    cancel_url: config.cancelUrl || 'http://localhost:5000/api/v1/payments/sslcommerz/cancel',
    ipn_url: config.ipnUrl || 'http://localhost:5000/api/v1/payments/sslcommerz/ipn',

    // কাস্টমার তথ্য
    cus_name: order.customer.name || 'Valued Customer',
    cus_email: order.customer.email || 'customer@example.com',
    cus_add1: shipping?.street || 'Dhaka',
    cus_city: shipping?.city || 'Dhaka',
    cus_country: shipping?.country || 'Bangladesh',
    cus_phone: shipping?.phone || '01711223344',
    cus_postcode: shipping?.postalCode || '1209',

    // ✅ শিপিং তথ্য (যা SSLCommerz চেয়েছে)
    ship_name: order.customer.name || 'Valued Customer',
    ship_add1: shipping?.street || 'Dhaka',
    ship_city: shipping?.city || 'Dhaka',
    ship_postcode: shipping?.postalCode || '1209',
    ship_country: shipping?.country || 'Bangladesh',

    // প্রোডাক্ট তথ্য
    shipping_method: 'Courier',
    product_name: `Order ${order.orderNumber}`,
    product_category: 'General',
    product_profile: 'general',
  });

  // ঙ. SSLCommerz API তে পোস্ট করা
  const gatewayUrl = config.isLive
    ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
    : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

  const response = await fetch(gatewayUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: sslPayload.toString(),
  });

  const data: any = await response.json();

  if (data?.status !== "SUCCESS") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      data?.failedreason ||
        "Failed to initiate payment session with SSLCommerz!",
    );
  }

  return {
    paymentUrl: data.GatewayPageURL,
    transactionId,
    orderId: order.id,
    amount: order.totalAmount,
  };
};

// ২. পেমেন্ট ভ্যালিডেশন ও স্ট্যাটাস সম্পন্ন করা (Double-Verification)
const validatePayment = async (callbackData: ISSLCommerzCallback) => {
  const { val_id, tran_id, status } = callbackData;

  if (status !== "VALID" && status !== "VALIDATED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid payment transaction status from gateway!",
    );
  }

  // ক. সিক্রেট ভ্যালিডেশন এপিআই কল করা (Server-to-Server Double Check)
  const validationUrl = config.isLive
    ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${config.storeId}&store_passwd=${config.storePasswd}&v=1&format=json`
    : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${val_id}&store_id=${config.storeId || "testbox"}&store_passwd=${config.storePasswd || "qwerty"}&v=1&format=json`;

  const response = await fetch(validationUrl);
  const validatedData: any = await response.json();

  if (
    validatedData?.status !== "VALID" &&
    validatedData?.status !== "VALIDATED"
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment verification failed on SSLCommerz server!",
    );
  }

  // খ. ডাটাবেজের Payment রেকর্ডটি বের করা
  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
    include: { order: true },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment record not found!");
  }

  // গ. ট্রানজ্যাকশনে Payment এবং Order স্ট্যাটাস COMPLETED করা
  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        rawResponse: validatedData,
      },
    });
    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "PAID",
      },
    });
    return updatedPayment;
  });
  return result;
};

// ৩. পেমেন্ট ফেইল্ড হ্যান্ডলার
const handlePaymentFail = async (callbackData: ISSLCommerzCallback) => {
  const { tran_id } = callbackData;
  const payment = await prisma.payment.findUnique({
    where: { transactionId: tran_id },
  });
  if (payment) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", rawResponse: callbackData },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: "FAILED" },
      }),
    ]);
  }
  return { message: "Payment failed!" };
};

// ৪. নির্দিষ্ট অর্ডারের পেমেন্ট স্ট্যাটাস দেখা
const getPaymentByOrderId = async (userId: string, orderId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          customerId: true,
        },
      },
    },
  });
  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No payment record found for this order!",
    );
  }
  if (payment.order.customerId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Unauthorized access to this payment details!",
    );
  }
  return payment;
};

export const PaymentService = {
  initiatePayment,
  validatePayment,
  handlePaymentFail,
  getPaymentByOrderId,
};
