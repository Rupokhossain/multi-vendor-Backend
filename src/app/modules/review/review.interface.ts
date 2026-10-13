export interface ICreateReviewPayload {
  productId: string;
  rating: number;
  comment?: string;
  images?: string[];
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
  images?: string[];
}

export interface IReviewFilterOptions {
  rating?: number;
  searchTerm?: string;
}