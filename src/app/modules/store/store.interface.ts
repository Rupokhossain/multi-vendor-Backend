import { VerificationStatus } from "../../../generated/prisma/enums";

export interface ICreateStorePayload {
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  tradeLicense?: string;
}
export interface IUpdateStorePayload {
  name?: string;
  description?: string;
  logo?: string;
  banner?: string;
  tradeLicense?: string;
}
export interface IStoreFilterRequest {
  searchTerm?: string;
  verificationStatus?: VerificationStatus;
}