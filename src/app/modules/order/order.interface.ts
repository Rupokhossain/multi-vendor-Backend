import { OrderStatus, PaymentMethod, SubOrderStatus } from "../../../generated/prisma/enums";

export interface IShippingAddress {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ICreateOrderPayload {
  shippingAddress: IShippingAddress;
  paymentMethod: PaymentMethod;
  // অপশনাল: যদি কার্ট ছাড়া সরাসরি "Buy Now" করে
  items?: Array<{
    variantId: string;
    quantity: number;
  }>;
}

export interface IUpdateSubOrderStatusPayload {
  status: SubOrderStatus;
  trackingNumber?: string;
}