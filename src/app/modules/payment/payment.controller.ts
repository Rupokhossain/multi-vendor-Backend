import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { PaymentService } from './payment.service';
import sendResponse from '../../utils/sendResponse';

const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const userRole = user?.role; // ✅ রোল নেওয়া হলো
  const result = await PaymentService.initiatePayment(
    userId,
    userRole,
    req.body.orderId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment session initiated successfully!',
    data: result,
  });
});


const sslCommerzSuccess = catchAsync(async (req: Request, res: Response) => {
  await PaymentService.validatePayment(req.body);
  // ব্রাউজারে সফল পেমেন্ট স্ক্রিন রেন্ডার করা
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #28a745;">🎉 Payment Successful!</h1>
      <p style="font-size: 18px;">Your payment has been verified and processed securely via SSLCommerz.</p>
      <p>Transaction ID: <strong>${req.body.tran_id}</strong></p>
      <p>You can safely close this window or return to the application.</p>
    </div>
  `);
});


// SSLCommerz ফেইল্ড রিডাইরেক্ট হ্যান্ডলার
const sslCommerzFail = catchAsync(async (req: Request, res: Response) => {
  await PaymentService.handlePaymentFail(req.body);
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #dc3545;">❌ Payment Failed!</h1>
      <p style="font-size: 18px;">The transaction could not be completed.</p>
      <p>Transaction ID: <strong>${req.body.tran_id}</strong></p>
    </div>
  `);
});



// SSLCommerz ক্যানসেল হ্যান্ডলার
const sslCommerzCancel = catchAsync(async (req: Request, res: Response) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #ffc107;">⚠️ Payment Cancelled</h1>
      <p style="font-size: 18px;">You cancelled the transaction.</p>
    </div>
  `);
});



// ব্যাকগ্রাউন্ড IPN Webhook হ্যান্ডলার
const sslCommerzIpn = catchAsync(async (req: Request, res: Response) => {
  await PaymentService.validatePayment(req.body);
  res.status(httpStatus.OK).json({ received: true });
});

const getPaymentByOrderId = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const userId = user?.id || user?.userId;
  const result = await PaymentService.getPaymentByOrderId(
    userId,
    req.params.orderId as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment details retrieved successfully!',
    data: result,
  });
});

export const PaymentController = {
  initiatePayment,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
  sslCommerzIpn,
  getPaymentByOrderId,
};