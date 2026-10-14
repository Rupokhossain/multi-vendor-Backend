
import { z } from 'zod';

const toggleWishlistSchema = z.object({
  body: z.object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .uuid('Invalid product ID format'),
  }),
});

export const wishlistValidations = {
  toggleWishlistSchema,
};
