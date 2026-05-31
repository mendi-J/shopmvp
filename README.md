# ShopMVP — Full-Stack E-Commerce Application

A complete, production-ready MVP e-commerce platform built with Next.js 14, Express.js, and PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TailwindCSS, React Context |
| Backend | Node.js, Express.js |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + OTP (6-digit, 5-min expiry, max 3 attempts) |
| Payments | Simulated card/PayPal flow |
| Email | Nodemailer (Mailtrap for dev) |

---

## Project Structure

```
E-commerce/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Sample data seeder
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── middleware/         # Auth + error handling
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Email service
│   │   └── utils/              # JWT + OTP helpers
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── page.js                 # Landing page
│   │   │   ├── auth/register/          # Registration
│   │   │   ├── auth/login/             # Login
│   │   │   ├── auth/verify-otp/        # OTP verification
│   │   │   ├── dashboard/              # User dashboard
│   │   │   ├── products/               # Product listing + search
│   │   │   ├── products/[id]/          # Product detail
│   │   │   ├── cart/                   # Shopping cart
│   │   │   ├── checkout/               # Shipping details
│   │   │   ├── payment/                # Payment processing
│   │   │   ├── orders/                 # Order history
│   │   │   ├── orders/[id]/            # Order confirmation
│   │   │   └── profile/                # User profile
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   └── ProductCard.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.js          # Auth state
│   │   │   └── CartContext.js          # Cart state
│   │   └── lib/
│   │       └── api.js                  # Axios API client
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- npm or yarn

---

### 1. Database Setup

```bash
# Create the database in PostgreSQL
psql -U postgres -c "CREATE DATABASE ecommerce_db;"
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ecommerce_db"
JWT_SECRET="your-secret-key-min-32-chars-change-this"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# For OTP emails — leave blank to print OTPs to console (dev mode)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

```bash
# Run database migrations
npx prisma migrate dev --name init

# Seed with sample products and a test user
npm run db:seed

# Start the backend server
npm run dev
```

Backend runs at: **http://localhost:5000**

> **OTP Dev Mode:** If `SMTP_USER` is not set, OTP codes are printed directly to the backend console. Watch the terminal when registering.

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Environment is pre-configured — no changes needed for local dev
# (frontend/.env.local already points to http://localhost:5000/api/v1)

# Start the development server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## Demo Credentials

After seeding, you can log in immediately:

| Field | Value |
|-------|-------|
| Email | `test@example.com` |
| Password | `password123` |

The test account is pre-verified (no OTP needed).

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (email OR phone + password) |
| POST | `/auth/verify-otp` | Verify OTP code |
| POST | `/auth/login` | Login with email/phone + password |
| POST | `/auth/resend-otp` | Resend OTP code |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (paginated, filterable by category) |
| GET | `/products/search?q=` | Search by name/description/category |
| GET | `/products/:id` | Get product detail |

### Cart (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get cart with summary |
| POST | `/cart/items` | Add item `{ productId, quantity }` |
| PUT | `/cart/items/:productId` | Update quantity |
| DELETE | `/cart/items/:productId` | Remove item |
| DELETE | `/cart` | Clear cart |

### Checkout & Payment (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/checkout` | Validate cart + shipping preview |
| POST | `/payment` | Process payment + create order |

### Orders (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | List all my orders |
| GET | `/orders/:id` | Get order detail |

### Profile (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get my profile |
| PUT | `/profile` | Update profile info |
| PUT | `/profile/password` | Change password |

---

## Payment Testing

The payment system is simulated (no real charges):

- **Any card number** → Payment succeeds
- **Card ending in `0000`** (e.g. `4111 1111 1111 0000`) → Payment declined
- Use any future expiry date and any 3-digit CVV

---

## Pricing Logic

| Component | Value |
|-----------|-------|
| Tax | 10% of subtotal |
| Delivery fee | $4.99 |
| Free delivery threshold | Orders ≥ $50 |

---

## Database Schema

```
User ─── OTP
  │
  ├── Cart ─── CartItem ─── Product
  │
  └── Order ─── OrderItem ─── Product
```

---

## Environment Variables Summary

### Backend (`backend/.env`)
```
DATABASE_URL      PostgreSQL connection string
JWT_SECRET        Secret key for JWT signing (min 32 chars)
JWT_EXPIRES_IN    Token lifetime (default: 7d)
PORT              Server port (default: 5000)
NODE_ENV          development | production
FRONTEND_URL      Allowed CORS origin
SMTP_HOST         Email server (blank = console OTP in dev)
SMTP_PORT         Email server port
SMTP_USER         Email username
SMTP_PASS         Email password
SMTP_FROM         Sender display name and address
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL   Backend API base URL
```

---

## Features

- **Auth**: Register with email or phone, OTP verification (6-digit, 5min TTL, max 3 attempts), JWT sessions
- **Products**: Paginated listing, category filter, full-text search, stock tracking
- **Cart**: Persistent server-side cart, real-time totals, stock validation
- **Checkout**: Shipping details form with pre-filled user info
- **Payment**: Card (simulated), PayPal (simulated), order creation in DB transaction
- **Orders**: Full order history, order detail with status and breakdown
- **Profile**: Edit personal info, change password with current-password validation
- **UI**: Mobile-first responsive design, loading states, toast notifications
