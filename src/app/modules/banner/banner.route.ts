import { Router } from "express";
import { BannerController } from "./banner.controller";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { bannerValidations } from "./banner.validaiton";

const router = Router();

// ১. হোমপেজে অ্যাক্টিভ ব্যানার দেখার পাবলিক রাউট
router.get("/active", BannerController.getActiveBanners);

// ২. অ্যাডমিন: নতুন ব্যানার তৈরি
router.post(
  "/",
  auth(Role.SUPER_ADMIN),
  validateRequest(bannerValidations.createBannerSchema),
  BannerController.createBanner,
);

// ৩. অ্যাডমিন: সব ব্যানারের লিস্ট দেখা
router.get("/", auth(Role.SUPER_ADMIN), BannerController.getAllBanners);

// ৪. নির্দিষ্ট ব্যানার বিস্তারিত দেখা
router.get("/:id", BannerController.getBannerById);

// ৫. অ্যাডমিন: ব্যানার এডিট করা
router.patch(
  "/:id",
  auth(Role.SUPER_ADMIN),
  validateRequest(bannerValidations.updateBannerSchema),
  BannerController.updateBanner,
);

// ৬. অ্যাডমিন: ব্যানার ডিলিট করা
router.delete("/:id", auth(Role.SUPER_ADMIN), BannerController.deleteBanner);

export const BannerRoutes = router;
