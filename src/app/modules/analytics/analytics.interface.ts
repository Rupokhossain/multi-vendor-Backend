export interface IAdminAnalyticsSummary {
  financials: {
    totalRevenue: number;
    totalPlatformEarnings: number;
    totalVendorPayouts: number;
  };
  counts: {
    totalOrders: number;
    totalCustomers: number;
    totalVendors: number;
    totalProducts: number;
  };
  orderStatusCounts: Record<string, number>;
  topSellingProducts: Array<{
    productId: string;
    title: string;
    slug: string;
    images: string[];
    totalQuantitySold: number;
    totalRevenue: number;
  }>;
  recentOrders: any[];
}

export interface IVendorAnalyticsSummary {
  storeInfo: {
    id: string;
    name: string;
    slug: string;
  };
  financials: {
    walletBalance: number;
    pendingBalance: number;
    totalStoreEarnings: number;
    totalWithdrawn: number;
  };
  orderMetrics: {
    totalSubOrders: number;
    statusCounts: Record<string, number>;
  };
  totalProducts: number;
  recentSubOrders: any[];
}