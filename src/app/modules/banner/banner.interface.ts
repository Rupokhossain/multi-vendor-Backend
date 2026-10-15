export interface ICreateBannerPayload {
  title: string;
  image: string;
  link?: string;
  position?: any;
  isActive?: boolean;
  order?: number;
}

export interface IUpdateBannerPayload {
  title?: string;
  image?: string;
  link?: string;
  position?: any;
  isActive?: boolean;
  order?: number;
}

export interface IBannerFilterOptions {
  position?: string;
  isActive?: string;
  searchTerm?: string;
}