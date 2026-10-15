/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  IAdminAnalyticsSummary,
  IVendorAnalyticsSummary,
} from "./analytics.interface";

// ১. সুপার অ্যাডমিন গ্লোবাল প্ল্যাটফর্ম এনালাইটিক্স
const getAdminAnalytics = async (): Promise<IAdminAnalyticsSummary> => {
  const [
    totalRevenueAgg,
    totalPlatformFeeAgg,
    totalPayoutsAgg,
    totalOrders,
    totalCustomers,
    totalVendors,
    totalProducts,
    orderStatusGroup,
    recentOrders,
    deliveredSubOrders,
  ] = await Promise.all([
    // ক. মোট রেভিনিউ (পেইড অর্ডারসমূহের যোগফল)
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
    }),

    // খ. প্ল্যাটফর্ম কমিশন থেকে মোট নিজস্ব আয়
    prisma.subOrder.aggregate({
      _sum: { platformFee: true },
    }),

    // গ. ভেন্ডারদের এপ্রুভ হওয়া উইথড্রয়ালের মোট পরিমাণ
    prisma.payoutRequest.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),

    // ঘ. কাউন্টসমূহ
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.store.count(),
    prisma.product.count({ where: { isPublished: true } }),

    // ঙ. অর্ডার স্ট্যাটাস অনুযায়ী গ্রুপিং
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // চ. সাম্প্রতিক ৫টি অর্ডার
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    // ছ. টপ সেলিং প্রোডাক্ট বের করতে সাব-অর্ডার আইটেম ফেচ করা
    prisma.subOrder.findMany({
      where: { status: "DELIVERED" },
      include: {
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
    }),
  ]);

  // স্ট্যাটাস কাউন্টস অবজেক্ট ফরম্যাট করা
  const orderStatusCounts: Record<string, number> = {};
  orderStatusGroup.forEach((group) => {
    orderStatusCounts[group.status] = group._count.id;
  });

  // টপ সেলিং প্রোডাক্টসের ডাটা এগ্রিগেট করা
  const productSalesMap = new Map<
    string,
    {
      productId: string;
      title: string;
      slug: string;
      images: string[];
      totalQuantitySold: number;
      totalRevenue: number;
    }
  >();
  deliveredSubOrders.forEach((subOrder) => {
    subOrder.items.forEach((item) => {
      const prod = item.variant?.product;
      if (!prod) return;
      const existing = productSalesMap.get(prod.id) || {
        productId: prod.id,
        title: prod.title,
        slug: prod.slug,
        images: prod.images || [],
        totalQuantitySold: 0,
        totalRevenue: 0,
      };
      existing.totalQuantitySold += item.quantity;
      existing.totalRevenue += item.price * item.quantity;
      productSalesMap.set(prod.id, existing);
    });
  });

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
    .slice(0, 5);
  return {
    financials: {
      totalRevenue: totalRevenueAgg._sum.totalAmount || 0,
      totalPlatformEarnings: totalPlatformFeeAgg._sum.platformFee || 0,
      totalVendorPayouts: totalPayoutsAgg._sum.amount || 0,
    },
    counts: {
      totalOrders,
      totalCustomers,
      totalVendors,
      totalProducts,
    },
    orderStatusCounts,
    topSellingProducts,
    recentOrders,
  };
};

// ২. ভেন্ডার নিজস্ব স্টোর এনালাইটিক্স
const getVendorAnalytics = async (
  userId: string,
): Promise<IVendorAnalyticsSummary> => {
  const store = await prisma.store.findFirst({
    where: { userId },
  });
  if (!store) {
    throw new AppError(httpStatus.NOT_FOUND, "You do not own any store!");
  }
  const [
    totalEarningsAgg,
    totalWithdrawnAgg,
    totalSubOrders,
    subOrderStatusGroup,
    totalProducts,
    recentSubOrders,
  ] = await Promise.all([
    // ক. ভেন্ডারের সর্বমোট আয় (Delivered orders)
    prisma.subOrder.aggregate({
      where: { storeId: store.id, status: "DELIVERED" },
      _sum: { vendorEarnings: true },
    }),
    // খ. ভেন্ডার মোট কত টাকা উইথড্র করেছে
    prisma.payoutRequest.aggregate({
      where: { storeId: store.id, status: "APPROVED" },
      _sum: { amount: true },
    }),
    // গ. মোট সাব-অর্ডারের সংখ্যা
    prisma.subOrder.count({ where: { storeId: store.id } }),
    // ঘ. স্ট্যাটাস গ্রুপ
    prisma.subOrder.groupBy({
      by: ["status"],
      where: { storeId: store.id },
      _count: { id: true },
    }),
    // ঙ. এই স্টোরের প্রোডাক্ট সংখ্যা
    prisma.product.count({ where: { storeId: store.id } }),
    // চ. সাম্প্রতিক ৫টি সাব-অর্ডার
    prisma.subOrder.findMany({
      where: { storeId: store.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variant: {
              select: {
                sku: true,
                price: true,
              },
            },
          },
        },
      },
    }),
  ]);
  const statusCounts: Record<string, number> = {};
  subOrderStatusGroup.forEach((group) => {
    statusCounts[group.status] = group._count.id;
  });
  return {
    storeInfo: {
      id: store.id,
      name: store.name,
      slug: store.slug,
    },
    financials: {
      walletBalance: store.walletBalance,
      pendingBalance: store.pendingBalance,
      totalStoreEarnings: totalEarningsAgg._sum.vendorEarnings || 0,
      totalWithdrawn: totalWithdrawnAgg._sum.amount || 0,
    },
    orderMetrics: {
      totalSubOrders,
      statusCounts,
    },
    totalProducts,
    recentSubOrders,
  };
};
export const AnalyticsService = {
  getAdminAnalytics,
  getVendorAnalytics,
};
