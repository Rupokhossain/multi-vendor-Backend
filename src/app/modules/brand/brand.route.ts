import { Router } from 'express';
import { brandController } from './brand.controller';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import validateRequest from '../../middlewares/validateRequest';
import { brandValidations } from './brand.validation';

const router = Router();

router.get('/', brandController.getAllBrands);
router.get('/:slug', brandController.getBrandBySlug);

router.post(
  '/',
  auth(Role.SUPER_ADMIN),
  validateRequest(brandValidations.createBrandSchema),
  brandController.createBrand
);

router.patch(
  '/:id',
  auth(Role.SUPER_ADMIN),
  validateRequest(brandValidations.updateBrandSchema),
  brandController.updateBrand
);

router.delete('/:id', auth(Role.SUPER_ADMIN), brandController.deleteBrand);

export const brandRoutes = router;