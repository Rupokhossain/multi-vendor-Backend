import { Router } from 'express';
import { productController } from './product.controller';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import validateRequest from '../../middlewares/validateRequest';
import { productValidations } from './product.validation';


const router = Router();

// ১. পাবলিক এন্ডপয়েন্টস (ক্যাটালগ ব্রাউজিং)
router.get('/', productController.getAllProducts);
router.get('/details/:slug', productController.getProductBySlug);

// ২. ভেন্ডরের নিজস্ব প্রোডাক্ট তালিকা (ড্যাশবোর্ড)
router.get(
  '/my-products',
 auth(Role.VENDOR, Role.SUPER_ADMIN),
  productController.getMyStoreProducts
);

// ৩. প্রোডাক্ট আপলোড (শুধুমাত্র ভেন্ডর)
router.post(
  '/',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(productValidations.createProductSchema),
  productController.createProduct
);

// ৪. প্রোডাক্ট আপডেট ও ডিলিট
router.patch(
  '/:id',
  auth(Role.VENDOR),
  validateRequest(productValidations.updateProductSchema),
  productController.updateProduct
);

router.delete(
  '/:id',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  productController.deleteProduct
);

export const productRoutes = router;