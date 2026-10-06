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


app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 Nexus-Market Multi-Vendor API Server is Running!',
  });
});


app.use(globalErrorHandler);
app.use(notFound);

export default app;