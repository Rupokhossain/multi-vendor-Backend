import app from "./app.js";
import dotenv from "dotenv";
import { prisma } from "./app/lib/prisma.js";
import { redisClient } from "./app/lib/redis.js";
import { transporter } from "./app/lib/nodemailer.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    await redisClient.connect();
    console.log("Redis Connected Successfully");

    await transporter.verify();
    console.log("Nodemailer Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`🚀 Server successfully started on port: ${PORT}`);
      console.log(`🌐 Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

main();
