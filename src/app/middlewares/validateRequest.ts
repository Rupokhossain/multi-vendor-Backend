import z from "zod";
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";

export const validateRequest = (zodSchema: z.ZodObject<any>) => {
  return catchAsync((req: Request, res: Response, next: NextFunction) => {
    // 👈 body এবং cookies অবজেক্ট আকারে Zod-এ পাঠানো হলো
    const result = zodSchema.safeParse({
      body: req.body,
      cookies: req.cookies,
    });

    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }

    // ভ্যালিডেশনের পর ক্লিন ডাটা বডিতে সেট করা
    if (result.data?.body) {
      req.body = result.data.body;
    }

    next();
  });
};

export default validateRequest;