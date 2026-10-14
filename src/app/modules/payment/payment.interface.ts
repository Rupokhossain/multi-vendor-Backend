export interface IInitiatePaymentPayload {
  orderId: string;
}

export interface ISSLCommerzCallback {
  val_id?: string;
  tran_id: string;
  amount: string;
  card_type?: string;
  bank_tran_id?: string;
  status: string;
  error?: string;
  [key: string]: any;
}