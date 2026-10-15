import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRoutes } from './app/modules/auth/auth.route';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { notFound } from './app/middlewares/notFound';
import { storeRoutes } from './app/modules/store/store.route';
import { categoryRoutes } from './app/modules/category/category.route';
import { brandRoutes } from './app/modules/brand/brand.route';
import { productRoutes } from './app/modules/product/product.route';
import { cartRoutes } from './app/modules/cart/cart.route';
import { orderRoutes } from './app/modules/order/order.route';
import { ReviewRoutes } from './app/modules/review/review.route';
import { PayoutRoutes } from './app/modules/payout/payout.route';
import { CouponRoutes } from './app/modules/coupon/coupon.route';
import { WishlistRoutes } from './app/modules/wishlist/wishlist.route';
import { PaymentRoutes } from './app/modules/payment/payment.route';
import { AnalyticsRoutes } from './app/modules/analytics/analytics.route';
import { AddressRoutes } from './app/modules/address/address.route';
import { BannerRoutes } from './app/modules/banner/banner.route';
import { SystemSettingRoutes } from './app/modules/systemSetting/systemSetting.route';
import { uploadRoutes } from './app/modules/upload/upload.route';

const app: Application = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/brands", brandRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", ReviewRoutes);
app.use("/api/v1/payouts", PayoutRoutes);
app.use("/api/v1/coupons", CouponRoutes);
app.use("/api/v1/wishlists", WishlistRoutes);
app.use("/api/v1/payments", PaymentRoutes);
app.use("/api/v1/analytics", AnalyticsRoutes);
app.use("/api/v1/addresses", AddressRoutes);
app.use("/api/v1/banners", BannerRoutes);
app.use("/api/v1/system-settings", SystemSettingRoutes);
app.use("/api/v1/uploads", uploadRoutes);


app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 Nexus-Market Multi-Vendor API Server is Running!',
  });
});


app.use(globalErrorHandler);
app.use(notFound);

export default app;