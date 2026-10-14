export interface ICreateCouponPayload {
  code: string;
  discountType?: any;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  expiresAt: string | Date;
  isActive?: boolean;
}

export interface IUpdateCouponPayload {
  code?: string;
  discountType?: any;
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  expiresAt?: string | Date;
  isActive?: boolean;
}

export interface IApplyCouponPayload {
  code: string;
  orderAmount?: number;
}

export interface ICouponFilterOptions {
  searchTerm?: string;
  isActive?: string;
}