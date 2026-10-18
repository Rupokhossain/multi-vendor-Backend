# Nexus-Market --- Multi-Vendor E-Commerce Backend

A modular REST API backend for a multi-vendor marketplace, built with
**Node.js, Express 5, TypeScript, PostgreSQL, and Prisma ORM 7**.

Nexus-Market is designed to support vendor stores, product variants,
multi-vendor checkout, order management, payment workflows, courier
logistics, customer reviews, promotions, and vendor payouts.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma
ORM](https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

------------------------------------------------------------------------

## Table of Contents

-   [Overview](#overview)
-   [Key Features](#key-features)
-   [Order and Settlement Workflow](#order-and-settlement-workflow)
-   [Technology Stack](#technology-stack)
-   [Project Structure](#project-structure)
-   [Prerequisites](#prerequisites)
-   [Getting Started](#getting-started)
-   [Environment Variables](#environment-variables)
-   [API Endpoints](#api-endpoints)
-   [Security Considerations](#security-considerations)
-   [Development Notes](#development-notes)
-   [License](#license)

## Overview

Nexus-Market is a backend foundation for a marketplace where multiple
vendors can sell products through a single platform. Customers can
browse products, add variants to a cart, place orders, and pay using an
available payment method. Vendors can manage stores and products, while
platform staff can manage orders, delivery workflows, payouts, and
analytics.

The system is organized into feature-based modules to keep business
logic easier to maintain and extend.

## Key Features

### Store and Vendor Management

-   Vendor onboarding and store creation.
-   Store verification workflow with `PENDING`, `VERIFIED`, and
    `REJECTED` states.
-   Store slugs for public store pages.
-   Role-based access for customers, vendors, staff, and administrators.

### Product Catalog

-   Product variants such as size and color.
-   Variant-specific SKU, pricing, and stock.
-   Product image upload support through Multer and Cloudinary.
-   Stock checks during order processing.

### Cart and Multi-Vendor Orders

-   Cart support for product variants.
-   Checkout designed to split a customer's order into separate
    sub-orders by vendor.
-   Order and sub-order lifecycle management.
-   Inventory updates and financial operations designed to use database
    transactions.

### Courier and Delivery

-   Courier adapter designed for Steadfast integration.
-   Parcel booking and shipment tracking workflow.
-   Delivery status handling, including `BOOKED`, `PICKED_UP`,
    `IN_TRANSIT`, and `DELIVERED`.
-   Delivery confirmation can be used as the trigger for releasing
    vendor earnings.

> **Integration note:** Live booking, tracking, and webhook behavior
> depends on valid courier credentials and the actual implementation
> configured in the project. A demo/mock courier adapter can be used
> during development when no live courier account is available.

### Payments

-   SSLCommerz payment workflow.
-   Cash on Delivery (COD) support.
-   Payment status synchronization and IPN validation workflow.
-   Sandbox configuration for payment testing.

### Authentication and Authorization

-   Email verification using time-limited OTPs stored in Redis.
-   JWT access and refresh-token workflow.
-   Google OAuth 2.0 sign-in support.
-   Role-based access control for `CUSTOMER`, `VENDOR`, `STAFF`, and
    `SUPER_ADMIN`.

### Reviews and Ratings

-   Verified-purchase review workflow.
-   Product rating aggregation.
-   Review eligibility tied to delivered orders.

### Coupons and Promotions

-   Fixed-amount and percentage discounts.
-   Coupon validity windows.
-   Minimum purchase thresholds and maximum discount limits.

### Vendor Wallet and Payouts

-   Separate pending and withdrawable vendor balances.
-   Platform commission tracking.
-   Vendor payout requests and administrator approval workflow.
-   Delivery-based settlement workflow.

### Uploads and Analytics

-   Single and multiple image uploads using Multer and Cloudinary.
-   File type and size validation.
-   Admin and vendor analytics endpoints for marketplace performance.

## Order and Settlement Workflow

``` text
Customer
   |
   | Add products from multiple vendors to cart
   v
Checkout and Payment
   |
   v
Create Main Order
   |
   +----> Sub-order for Vendor A
   |
   +----> Sub-order for Vendor B
   |
   v
Vendor prepares the order
   |
   v
Courier booking and shipment tracking
   |
   v
Delivery confirmed
   |
   v
Vendor pending balance becomes withdrawable
```

The intended settlement workflow holds vendor earnings as pending until
delivery is confirmed. Actual payment, commission, and balance behavior
should be verified against the current service implementation before
production use.

## Technology Stack

  Layer                   Technology
  ----------------------- --------------------------
  Runtime                 Node.js
  Language                TypeScript
  API framework           Express.js 5
  ORM                     Prisma ORM 7
  Database                PostgreSQL
  Cache and OTP storage   Redis
  Validation              Zod
  Image storage           Cloudinary
  File handling           Multer
  Payments                SSLCommerz
  Courier integration     Steadfast adapter
  Email                   Nodemailer / SMTP
  Authentication          JWT and Google OAuth 2.0

## Project Structure

``` text
nexus-market-backend/
├── prisma/
│   └── schema/                 # Multi-file Prisma schema
│       ├── user.prisma
│       ├── store.prisma
│       ├── product.prisma
│       ├── order.prisma
│       ├── subOrder.prisma
│       ├── payment.prisma
│       └── ...
├── src/
│   ├── app/
│   │   ├── config/             # Environment configuration
│   │   ├── errors/             # Custom errors and error handling
│   │   ├── lib/                # Prisma, Redis, Cloudinary clients
│   │   ├── middlewares/        # Auth, validation, upload, error handlers
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── store/
│   │   │   ├── product/
│   │   │   ├── cart/
│   │   │   ├── order/
│   │   │   ├── courier/
│   │   │   ├── payment/
│   │   │   ├── review/
│   │   │   ├── payout/
│   │   │   ├── coupon/
│   │   │   ├── banner/
│   │   │   ├── upload/
│   │   │   └── analytics/
│   │   ├── routes/             # Central route registration
│   │   └── utils/              # Shared utilities and helpers
│   ├── app.ts                  # Express app setup
│   └── server.ts               # Server startup
├── .env.example
├── package.json
└── README.md
```

> This structure is a reference for the intended organization. Update
> the tree to match the actual repository if module or file names
> differ.

## Prerequisites

Install the following before starting:

-   Node.js (v20 or later recommended)
-   npm
-   PostgreSQL
-   Redis
-   Git

You will also need credentials for the external services you want to
test, such as SMTP, Cloudinary, Google OAuth, SSLCommerz, or Steadfast.
External integrations can be configured later if you are only running
local features.

## Getting Started

### 1. Clone the repository

Replace the URL below with your actual GitHub repository URL.

``` bash
git clone https://github.com/<your-username>/<your-repository>.git
cd <your-repository>
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root and add the values required by
your local setup. See [Environment Variables](#environment-variables).

### 4. Prepare Prisma

Use the commands supported by the Prisma configuration in this
repository:

``` bash
npx prisma generate
npx prisma db push
```

If the project uses a custom Prisma schema path or a Prisma
configuration file, include the appropriate schema/config option. Review
your `package.json` scripts before running database commands.

### 5. Start the development server

``` bash
npm run dev
```

The example configuration uses port `5000`, so the API may be available
at:

``` text
http://localhost:5000
```

The exact startup command and base URL depend on the scripts and
configuration in your repository.

## Environment Variables

Create a `.env` file locally. **Never commit real secrets, API keys,
passwords, or production credentials to GitHub.**

``` env
# Application
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/nexus_market?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_ACCESS_SECRET="replace_with_a_strong_access_secret"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="replace_with_a_strong_refresh_secret"
JWT_REFRESH_EXPIRES_IN="30d"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"

# SMTP / Nodemailer
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_email_app_password"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# SSLCommerz
SSL_STORE_ID="your_sandbox_store_id"
SSL_STORE_PASS="your_sandbox_store_password"
SSL_IS_LIVE=false

# Steadfast Courier
STEADFAST_API_KEY="your_courier_api_key"
STEADFAST_SECRET_KEY="your_courier_secret_key"
STEADFAST_BASE_URL="https://portal.steadfast.com.bd/api/v1"
```

Only add variables that are actually read by your application. If a
service is not configured, its related feature may not work. Keep `.env`
out of version control and consider committing a sanitized
`.env.example` instead.

## API Endpoints

The following table summarizes the API routes described for this
project. Confirm each route, HTTP method, and access rule against the
current router implementation before publishing it as a definitive API
contract.

Base path shown: `/api/v1`

  ------------------------------------------------------------------------------------------------
  Module         Method         Endpoint                          Purpose          Access
  -------------- -------------- --------------------------------- ---------------- ---------------
  Auth           `POST`         `/auth/register`                  Register an      Public
                                                                  account and      
                                                                  start email      
                                                                  verification     

  Auth           `POST`         `/auth/verify-email`              Verify email     Public
                                                                  with OTP         

  Auth           `POST`         `/auth/login`                     Log in and       Public
                                                                  receive tokens   

  Auth           `POST`         `/auth/refresh-token`             Refresh/rotate   Public
                                                                  tokens           

  Auth           `PATCH`        `/auth/change-password`           Change password  Authenticated

  Store          `POST`         `/stores`                         Request store    Customer
                                                                  onboarding       

  Products       `POST`         `/products`                       Create a product Vendor
                                                                  with variants    

  Cart           `POST`         `/cart`                           Add a product    Customer
                                                                  variant to cart  

  Orders         `POST`         `/orders`                         Checkout and     Customer
                                                                  create vendor    
                                                                  sub-orders       

  Courier        `POST`         `/courier/book/:subOrderId`       Book a shipment  Vendor/Admin

  Courier        `GET`          `/courier/track/:subOrderId`      Retrieve         Authenticated
                                                                  shipment         
                                                                  tracking         

  Courier        `POST`         `/courier/confirm-delivery/:id`   Confirm delivery Admin/Staff

  Payment        `POST`         `/payments/init/:orderId`         Initialize a     Customer
                                                                  payment session  

  Payment        `POST`         `/payments/ipn`                   Receive payment  Public callback
                                                                  notification     

  Payout         `POST`         `/payouts/request`                Request a vendor Vendor
                                                                  payout           

  Payout         `PATCH`        `/payouts/:id/approve`            Approve a payout Super Admin

  Uploads        `POST`         `/uploads/image`                  Upload one image Authenticated

  Uploads        `POST`         `/uploads/images`                 Upload multiple  Vendor/Admin
                                                                  images (up to    
                                                                  10)              

  Analytics      `GET`          `/analytics/admin`                View platform    Super Admin
                                                                  analytics        
  ------------------------------------------------------------------------------------------------

### API Testing

You can test the endpoints with Postman or another HTTP client. Add
authentication headers or cookies as required by your application's
authentication middleware.

Recommended documentation to add when available:

-   Postman collection or public API documentation URL
-   Live API base URL
-   Demo video
-   Test account details that do not expose real user data or production
    credentials

## Security Considerations

-   Hash passwords using the password-hashing library configured in the
    project.
-   Validate incoming request bodies, parameters, and query strings.
-   Apply authentication and role-based authorization to protected
    routes.
-   Use database transactions for related stock and balance changes.
-   Verify payment gateway callbacks server-side; do not trust a
    client-side success redirect alone.
-   Validate courier webhook requests according to the provider's
    supported authentication mechanism.
-   Use rate limiting for authentication and OTP endpoints.
-   Avoid returning internal stack traces or sensitive details in
    production error responses.
-   Store secrets in environment variables and rotate credentials if
    they are exposed.
-   Ensure that delivery confirmation and payout operations cannot be
    triggered by unauthorized users.

## Development Notes

-   Keep `.env` files and real credentials out of Git.
-   Update the API table whenever routes or permissions change.
-   Document any mock/demo courier behavior separately from live courier
    integration.
-   Verify payment, stock, commission, refund, and payout flows with
    tests before production deployment.
-   Do not describe an integration as live until it has been configured
    and tested with valid credentials.

## License

Add the license that applies to this repository. If you choose the MIT
License, include a `LICENSE` file containing the MIT License text and
update this section accordingly.
