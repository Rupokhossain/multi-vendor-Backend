import { Router } from 'express';
import { categoryController } from './category.controller';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import validateRequest from '../../middlewares/validateRequest';
import { categoryValidation } from './category.validation';


const router = Router();

// পাবলিক রুটস
router.get('/', categoryController.getCategoryTree);
router.get('/:slug', categoryController.getCategoryBySlug);

// অ্যাডমিন প্রোটেক্টেড রুটস
router.post(
  '/',
  auth(Role.SUPER_ADMIN),
  validateRequest(categoryValidation.createCategoryValidationSchema),
  categoryController.createCategory
);

router.patch(
  '/:id',
  auth(Role.SUPER_ADMIN),
  validateRequest(categoryValidation.updateCategoryValidationSchema),
  categoryController.updateCategory
);

router.delete('/:id', auth(Role.SUPER_ADMIN), categoryController.deleteCategory);

export const categoryRoutes = router;