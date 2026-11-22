# Orbit 🪐

> **Modern Full-Stack Personal Finance & Wealth Management System**  
> Built with React 19, Tailwind CSS, Node.js, Express, and MongoDB Atlas.  
> Production-ready with PWA offline queue, Swagger/OpenAPI docs, CI/CD, and hardened security.  
> Deployed seamlessly on **Vercel** (Frontend) & **Render** (Backend).

---

## 🌟 Overview

**Orbit** is a high-performance personal finance tracking and wealth intelligence application designed to give you clarity over your money. From granular daily expense logging to atomic inter-account transfers, subscription tracking, rule-based spending insights, and multi-factor security, Orbit combines clean aesthetics with banking-grade robustness.

Designed with **Dark Mode** and **Light Mode** first-class support, Orbit pairs an intuitive floating capsule navigation with real-time visual analytics, category budgeting, and multi-institution portfolio management.

---

## ✨ Full Feature Overview (All 9 Phases)

### 1. 🔄 Atomic Inter-Account Transfers
- **Dedicated Transfer Transaction Type**: Seamlessly transfer funds between any two accounts (e.g. from HDFC Salary to Cash Wallet).
- **Atomic Balance Updates**: Powered by MongoDB sessions/transactions ensuring both accounts update atomically or rollback on error.
- **Cashflow Integrity**: Transfers are excluded from income and expense velocity and category charts while keeping net worth strictly accurate.
- **Distinct Visual History**: Transfers display source and destination badges with unique arrow indicators.

### 2. 🔁 Subscriptions & Recurring Transactions
- **Recurring Engine**: Define rules by frequency (daily, weekly, monthly, yearly) with start dates and optional end dates.
- **Sleep-Resilient Catch-Up**: Automatically catches up and executes missed scheduled transactions upon user login or dashboard load, overcoming Render free-tier sleep.
- **Committed Spend Overview**: Real-time calculation of total monthly committed subscription spend, upcoming renewals, and one-click pause/resume/delete.

### 3. 🎯 Budgets & "Safe to Spend" Intelligence
- **Category Budgets**: Set monthly spending limits per category with dynamic progress bars.
- **Multi-Tier In-App Alerts**: Visual warning banners triggered at **80%** (nearing limit) and **100%** (exceeded budget).
- **Safe-to-Spend per Day**: Real-time daily safe-spending allowance computed based on remaining days in the current calendar month.

### 4. 📁 CSV Batch Import & Sanitized Export
- **Customizable Export**: Export transactions to CSV with account, category, and date-range filters.
- **Column-Mapping Import**: Upload CSVs with intelligent auto-mapping of columns (`Date`, `Amount`, `Description`, `Category`, `Account`).
- **Duplicate Detection**: Computes a SHA-256 hash (`date + amount + description + account`) to flag duplicate transactions before committing.
- **Dry-Run Validation Preview**: Inspect parsed rows, validation warnings, and duplicate flags in an interactive table before saving.

### 5. 🔍 Advanced Search, Multi-Tag Filtering & Notes
- **Multi-Field Free-Text Search**: Instant search matching across notes and transaction tags.
- **Tags & Notes**: Tag transactions with hashtags (e.g. `#groceries`, `#dining`, `#vacation`) with badge displays.
- **Compound Filters**: Filter transactions by date range, account, type (expense/income/transfer), tag, and min/max amount.
- **Server-Side Pagination**: Indexed queries (`{ user: 1, date: -1 }`, `{ user: 1, tags: 1 }`) for fast querying over thousands of records.

### 6. 🏆 Savings Goals & Smart Insights Engine
- **Target Savings Goals**: Set goals with target amounts, target dates, and real-time progress bars.
- **Suggested Monthly Contribution**: Calculates exactly how much you need to save each month to achieve each goal on time.
- **Quick Goal Deposits**: One-click modal to allocate savings directly from your accounts into your goal fund.
- **Rule-Based Smart Insights**:
  - MoM category spending surge detection (e.g., *"Food & Dining spend is up 32% vs last month"*).
  - Weekday vs. Weekend spending velocity comparison.
  - Savings rate analysis.

### 7. ⚡ Quick Add via Natural Language
- **Deterministic Text Parser**: Parses natural input strings like `"chai 40 yesterday"` or `"zomato 450 food"` into structured transaction drafts.
- **Zero-Latency Live Preview**: Visual confirmation chips show parsed amount, category, account, and date in real-time before saving.

### 8. 📱 PWA, Net Worth Trend, Demo Mode & OpenAPI
- **Progressive Web App (PWA)**: Installable on iOS, Android, and Desktop with web manifest and service worker.
- **Offline Sync Queue**: Log transactions even while completely offline; queued transactions automatically sync to the server when network connectivity is restored.
- **Net Worth Historical Trend**: 6-month historical net worth curve visualizing portfolio growth alongside liabilities (loans, credit card dues).
- **1-Click Demo Sandbox**: Explore the complete application with pre-seeded accounts, transactions, subscriptions, and budgets without signing up.
- **Interactive OpenAPI / Swagger Documentation**: Full OpenAPI 3.0.3 specification available at `/api/docs` and `/api/docs/openapi.json`.
- **Automated CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`) running backend test suites and frontend production verification builds on each commit.

### 9. 🛡️ Advanced Security & Audit Logs
- **Refresh Token Rotation**: Short-lived access tokens paired with rotating refresh tokens stored in secure, `httpOnly`, `sameSite` cookies with family reuse detection.
- **Per-Route Rate Limiting**: Dedicated rate limiters on authentication endpoints, token refresh, and batch CSV imports to prevent brute-force attacks and abuse.
- **Two-Factor Authentication (2FA)**: RFC 6238 TOTP two-factor authentication compatible with Google Authenticator, Apple Passwords, and Authy, complete with 8 emergency recovery backup codes.
- **Security Audit Logging**: Immutable audit log table recording logins, logouts, 2FA modifications, token rotations, and sensitive operations.

---

## 🛠️ Architecture & Tech Stack

```
Orbit/
├── client/                     # Frontend SPA (React 19 + Tailwind CSS)
│   ├── public/                 # Manifest & Service Worker (PWA)
│   ├── src/
│   │   ├── api/                # Axios API services
│   │   ├── components/         # Modals, charts, widgets, navigation
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Responsive page views
│   │   ├── services/           # Offline sync service
│   │   └── utils/              # Natural language parser, formatters
│   └── index.html
├── server/                     # Backend REST API (Node.js + Express)
│   ├── src/
│   │   ├── __tests__/          # Automated test suite
│   │   ├── config/             # DB & CORS configuration
│   │   ├── controllers/        # Business logic controllers
│   │   ├── docs/               # OpenAPI 3.0 specification
│   │   ├── middleware/         # Auth, validation, security, rate limiters
│   │   ├── models/             # Mongoose schemas (User, Account, Transaction, ...)
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # Cron catch-up, insights engine, seeders
│   │   ├── utils/              # RFC 6238 TOTP, crypto helpers
│   │   └── server.js           # Server entry point
│   └── .env
└── .github/workflows/          # GitHub Actions CI pipeline
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **MongoDB** instance (local or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `server/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/orbit?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
```

Start the backend server:
```bash
npm run dev
```

Run automated backend tests:
```bash
npm test
```

### 3. Frontend Setup
```bash
cd client
npm install
```

Create a `client/.env` file:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start Vite dev server:
```bash
npm run dev
```

---

## ☁️ Deployment Guide

### Deploying Frontend to Vercel
1. Push your repository to GitHub.
2. Link the repository in [Vercel](https://vercel.com).
3. Set **Root Directory** to `client`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-render-backend.onrender.com/api`
5. Deploy! Vercel handles SPA routing via `client/vercel.json`.

### Deploying Backend to Render
1. In [Render Dashboard](https://dashboard.render.com), create a new **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `mongodb+srv://...`
   - `JWT_SECRET` = `strong_random_jwt_secret`
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_URL` = `https://your-orbit-frontend.vercel.app`
   - `COOKIE_SECURE` = `true`
5. Deploy! Render will build and run the Node service with trust proxy and HTTPS enabled.

---

## 🧪 Testing

Orbit includes an automated test suite covering all core phases:
- Transfers balance math & portfolio net worth invariance
- Recurring subscription interval calculations
- Budget 80% & 100% alert thresholds & safe-to-spend per day
- CSV duplicate detection hash matching
- Tag filtering and multi-criteria search
- Deterministic natural language quick add parsing
- RFC 6238 TOTP 2FA secret generation, code verification & drift tolerance
- OpenAPI 3.0 specification validation

To run tests:
```bash
cd server
npm test
```

---

## 📄 License
MIT © Orbit
