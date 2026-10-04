import { createClient } from "redis";
import config from "../config";

console.log("🔍 Checking Redis URL:", config.redis_url ? "Found (Loaded)" : "MISSING (Undefined)");

export const redisClient = createClient({
  url: config.redis_url,
  socket: {
    // কানেকশন ফেইল হলে যেন বারবার লুপ না হয় (সর্বোচ্চ ২ বার ট্রাই করবে)
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        return new Error("Redis connection failed. Max retries reached.");
      }
      return 1000;
    },
  },
});

redisClient.on("error", (err) => console.log("❌ Redis Client Error:", err.message));