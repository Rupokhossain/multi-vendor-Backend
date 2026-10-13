export interface ICreatePayoutRequestPayload {
  amount: number;
  paymentMethod: string;
  accountInfo: string;
}

export interface IUpdatePayoutStatusPayload {
  status: any;
  adminNotes?: string;
}

export interface IPayoutFilterOptions {
  status?: string;
}