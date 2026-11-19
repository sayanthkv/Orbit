# Orbit

> **"Know where your money goes"**

Orbit is a production-quality personal expense tracker web application built on the **MERN stack** (MongoDB, Express, React, Node.js). It provides real-time financial tracking, multi-criteria transaction filtering, interactive spending analytics, category budgeting with 80% and 100% threshold alerts, recurring transaction automation via node-cron, and savings goals tracking.

---

## 🌟 Key Features

- **Auth & Security**: JWT stored in `httpOnly` secure cookies with cross-domain support, bcryptjs password hashing, Helmet HTTP headers, and strict rate-limiting.
- **Transactions Management**: Full CRUD for expenses and income with server-side pagination, date range filtering, category and payment method filters, and fast keyword note search.
- **Dashboard & Interactive Analytics**:
  - 4 Key Metric KPI Cards (Total Income, Total Expense, Net Balance, Savings Rate %) with Month-over-Month (MoM) indicators.
  - Category-wise Spending Donut Chart with custom hover tooltips.
  - Daily Spending Progression Area Chart throughout the selected month.
  - 6-Month Income vs Expense historical bar comparison.
  - Automated Smart Financial Insights (detects category spending spikes, savings highlights, and primary outflows).
- **Monthly Budgets**:
  - Category spending caps with live visual progress bars.
  - **80% Warning Flag** (Amber) and **100% Exceeded Alert** (Rose) visible directly on the Dashboard and Budgets page.
- **Recurring Transactions**: Background scheduler powered by `node-cron` that automatically creates scheduled transactions when due (weekly, monthly, yearly).
- **Custom Category Manager**: Color palette & Lucide icon picker with transaction safety deletion guards.
- **Savings Goals**: Milestone progress rings and deposit tracker.
- **Data Export**: Direct CSV streaming of transactions with applied filters.
- **Responsive Mobile-First UI**: Desktop sidebar + mobile bottom navigation bar with thumb-friendly controls, dark mode toggle, loading skeletons, and delete confirmation dialogs.

---

## 🏗️ Architecture & Monorepo Structure

```text
Orbit/
├── package.json                 # Monorepo runner scripts (concurrently)
├── README.md                    # Project documentation
├── server/                      # Express & Node.js backend (orbit-server)
│   ├── package.json
│   ├── .env.example
│   ├── render.yaml              # Render deployment configuration
│   └── src/
│       ├── config/              # MongoDB connection & CORS whitelist
│       ├── models/              # Mongoose schemas (User, Category, Transaction, Budget, Recurring, Goal)
│       ├── controllers/         # REST API business logic
│       ├── routes/              # Express API routers
│       ├── middleware/          # JWT auth, Zod validation, error handler
│       ├── services/            # node-cron scheduler & default category seeder
│       ├── validations/         # Zod request payload schemas
│       ├── scripts/             # Standalone seed and test scripts
│       └── server.js            # Express app entry point
└── client/                      # React & Vite frontend (orbit-client)
    ├── package.json
    ├── .env.example
    ├── vercel.json              # Vercel SPA rewrite configuration
    ├── index.html
    └── src/
        ├── api/                 # Axios clients with withCredentials: true
        ├── context/             # AuthContext, ThemeContext, ToastContext
        ├── components/          # Reusable UI, Layout, Charts, Modals
        ├── pages/               # Dashboard, Transactions, Budgets, Recurring, Categories, Goals, Settings
        └── utils/               # Formatters (INR/USD), icon mappers, constants
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local daemon or free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)

### 1. Clone & Install Dependencies

From the repository root:
```bash
# Install root orchestration tools
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 2. Configure Environment Variables

**Server (`server/.env`):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/orbit
JWT_SECRET=super_secret_orbit_jwt_key_development_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
```

**Client (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed Realistic Demo Data

Populate the database with demo transactions across 3 months, category budgets, recurring rules, and savings goals:
```bash
cd server
npm run seed
```

This creates the pre-configured demo user:
- **Email**: `demo@orbit.app`
- **Password**: `password123`

### 4. Run Development Servers

Run both the backend API and frontend Vite dev server concurrently:
```bash
# From root directory:
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 📡 REST API Reference

All API endpoints follow a standard response envelope:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and set httpOnly cookie | Public |
| `POST` | `/api/auth/logout` | Clear session cookie | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Protected |
| `PATCH` | `/api/auth/preferences` | Update currency & theme | Protected |

### 💳 Transactions (`/api/transactions`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | Paginated list with search & multi-filter (`startDate`, `endDate`, `type`, `categoryId`, `paymentMethod`, `search`, `page`, `limit`) |
| `POST` | `/api/transactions` | Create new transaction |
| `GET` | `/api/transactions/:id` | Get transaction by ID |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |

### 🏷️ Categories (`/api/categories`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | Get all default and custom categories |
| `POST` | `/api/categories` | Create custom category |
| `PUT` | `/api/categories/:id` | Update custom category |
| `DELETE` | `/api/categories/:id` | Delete custom category (with transaction safety check) |

### 📊 Analytics & Dashboard (`/api/analytics`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | KPI cards summary (Income, Expense, Balance, Savings Rate %, MoM change) |
| `GET` | `/api/analytics/category-breakdown` | Category distribution data for donut chart |
| `GET` | `/api/analytics/trends` | Daily spending progression & 6-month historical trends |
| `GET` | `/api/analytics/insights` | Month-over-month category spending surge & savings insights |

### 🎯 Budgets (`/api/budgets`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budgets` | Category limits, amount spent, remaining, and 80%/100% alert status |
| `POST` | `/api/budgets` | Set or update monthly budget |
| `DELETE` | `/api/budgets/:id` | Delete category budget |

### 🔁 Recurring Transactions (`/api/recurring`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/recurring` | List recurring schedule rules |
| `POST` | `/api/recurring` | Create recurring schedule |
| `PUT` | `/api/recurring/:id` | Update schedule or toggle active/paused |
| `DELETE` | `/api/recurring/:id` | Delete schedule |
| `POST` | `/api/recurring/process` | Manually trigger cron engine to process due entries |

### 💰 Savings Goals (`/api/goals`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/goals` | List all savings milestones |
| `POST` | `/api/goals` | Create new savings target |
| `PUT` | `/api/goals/:id` | Edit goal |
| `POST` | `/api/goals/:id/deposit` | Deposit funds towards goal |
| `DELETE` | `/api/goals/:id` | Delete goal |

### 📥 Export (`/api/export`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/export/csv` | Download CSV spreadsheet of transactions |

---

## 🌐 Production Deployment Guide

### Database: MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist network access (`0.0.0.0/0` for cloud deployment).
3. Copy your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/orbit?retryWrites=true&w=majority`.

### Backend: Render
1. Connect your repository to [Render](https://render.com) as a **Web Service**.
2. Root Directory: `server`.
3. Build Command: `npm install`.
4. Start Command: `node src/server.js`.
5. Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<A random 64-character string>`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `https://your-orbit-app.vercel.app`
   - `COOKIE_SECURE`: `true`

### Frontend: Vercel
1. Connect your repository to [Vercel](https://vercel.com).
2. Root Directory: `client`.
3. Framework Preset: `Vite`.
4. Environment Variables:
   - `VITE_API_URL`: `https://your-orbit-api.onrender.com/api`
5. Deploy! The included `vercel.json` ensures client-side routing works seamlessly across page reloads.

---

## 🧪 Verification & Automated Testing

Orbit includes end-to-end automated verification test scripts for every phase:
```bash
cd server

# Verify Phase 1: Foundation (Auth, JWT cookies, default categories)
node src/scripts/testPhase1.js

# Verify Phase 2: Core Tracking (CRUD, pagination, multi-filter, search)
node src/scripts/testPhase2.js

# Verify Phase 3: Analytics (Summary KPIs, MoM insights, donut/area/bar aggregations)
node src/scripts/testPhase3.js

# Verify Phase 4: Budgets & Recurring (80% & 100% threshold alerts, node-cron processing)
node src/scripts/testPhase4.js
```

---

## 📄 License
MIT &copy; 2026 Orbit Team. Know where your money goes.
