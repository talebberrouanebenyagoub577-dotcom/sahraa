# SAHRAA | صحرا

**The Amazon of COD products in the Gulf region**

A production-ready Arabic-first marketplace for GCC countries with integrated AI, Cash on Delivery, and multi-vendor support.

![SAHRAA](https://img.shields.io/badge/SAHRAA-Marketplace-f59e0b)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

## Features

### Marketplace
- Multi-vendor cart with COD, Stripe, and PayPal
- Product variants, reviews, wishlist, coupons
- Real-time inventory with low-stock alerts
- Order tracking and invoice generation

### GCC Focus
- 6 countries: SA, AE, KW, QA, BH, OM
- Arabic RTL (default) + English LTR
- Multi-currency: SAR, AED, KWD, QAR, BHD, OMR
- Shipping: Aramex, SMSA, J&T, DHL

### AI Powered
- Arabic AI chatbot assistant
- Semantic search with typo correction
- Personalized product recommendations
- AI product description generator

### User Roles
- Super Admin, Admin, Seller, Customer, Support Agent
- Full dashboards for each role
- COD network module with commission tracking

### Security & Performance
- JWT authentication with refresh tokens
- Rate limiting, CSRF, XSS protection
- Redis caching, SSR, image optimization
- PWA support with installable app

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes (REST) |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis (ioredis) |
| Auth | JWT + bcrypt |
| i18n | next-intl |
| Payments | Stripe, PayPal, COD |
| Container | Docker + Docker Compose |

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start database services
docker compose up -d postgres redis

# Configure environment
cp .env.example .env

# Setup database
npx prisma migrate dev --name init
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000/ar](http://localhost:3000/ar)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sahraa.com | Sahraa@2026 |
| Seller | seller@sahraa.com | Sahraa@2026 |
| Customer | customer@sahraa.com | Sahraa@2026 |

## Project Structure

```
sahra/
├── prisma/           # Database schema & seed
├── src/
│   ├── app/
│   │   ├── [locale]/ # i18n pages (ar/en)
│   │   └── api/      # REST API routes
│   ├── components/   # UI components
│   ├── lib/          # Core utilities
│   │   ├── auth/     # JWT & middleware
│   │   ├── ai/       # AI search & recommendations
│   │   └── api/      # API helpers
│   └── i18n/         # Internationalization
├── messages/         # Translation files
├── public/           # Static assets & PWA
├── docker-compose.yml
├── Dockerfile
└── DEPLOYMENT.md
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/me` | GET | Current user |
| `/api/products` | GET/POST | Product catalog |
| `/api/products/[slug]` | GET | Product details |
| `/api/search` | GET | AI semantic search |
| `/api/cart` | GET/POST/DELETE | Shopping cart |
| `/api/orders` | GET/POST | Order management |
| `/api/wishlist` | GET/POST/DELETE | Wishlist |
| `/api/ai/chat` | POST | AI assistant |
| `/api/ai/recommendations` | GET | Personalized products |
| `/api/admin/stats` | GET | Admin analytics |
| `/api/admin/cod-network` | GET/POST | COD suppliers |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production deployment guide.

```bash
# Docker production
docker compose up -d --build

# Manual production
npm run build && npm run start
```

## License

Proprietary - SAHRAA © 2026
