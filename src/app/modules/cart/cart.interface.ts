export interface IAddToCartPayload {
  variantId: string;
  quantity: number;
}

export interface IUpdateCartItemPayload {
  quantity: number;
}