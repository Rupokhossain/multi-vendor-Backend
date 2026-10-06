export interface ICreateVariantPayload {
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, any>; // e.g. { size: "42", color: "Black" }
}

export interface ICreateProductPayload {
  title: string;
  description: string;
  categoryId: string;
  brandId?: string;
  images: string[];
  isPublished?: boolean;
  variants: ICreateVariantPayload[];
}

export interface IUpdateProductPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  brandId?: string;
  images?: string[];
  isPublished?: boolean;
}

export interface IProductFilterRequest {
  searchTerm?: string;
  categoryId?: string;
  brandId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  isPublished?: boolean;
}