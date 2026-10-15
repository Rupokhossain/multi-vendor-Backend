export interface ICreateAddressPayload {
  fullName: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface IUpdateAddressPayload {
  fullName?: string;
  phone?: string;
  city?: string;
  area?: string;
  street?: string;
  postalCode?: string;
  isDefault?: boolean;
}