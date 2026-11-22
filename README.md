# Orbit 🪐

<div align="center">

![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

**Modern, Full-Stack Personal Finance & Wealth Management Platform**  
*Track expenses, manage multi-bank accounts, schedule subscriptions, automate safe-to-spend budgets, and gain deep visual intelligence over your net worth.*

[🌐 Live Production Web App](https://orbit-eight-expense-tracker.vercel.app) • [📖 Interactive Swagger API Docs](https://orbit-backend.onrender.com/api/docs)

</div>

---

## 📑 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features (Phases 1–9)](#-key-features-phases-19)
  - [1. Atomic Account Transfers](#1--atomic-account-transfers-phase-1)
  - [2. Subscriptions & Recurring Engine](#2--subscriptions--recurring-engine-phase-2)
  - [3. Budgets & "Safe to Spend" Intelligence](#3--budgets--safe-to-spend-intelligence-phase-3)
  - [4. CSV Batch Import & Sanitized Export](#4--csv-batch-import--sanitized-export-phase-4)
  - [5. Advanced Search, Filters & Tagging](#5--advanced-search-filters--tagging-phase-5)
  - [6. Savings Goals & Smart Spending Insights](#6--savings-goals--smart-spending-insights-phase-6)
  - [7. Quick Add via Natural Language](#7--quick-add-via-natural-language-phase-7)
  - [8. PWA, Net Worth Trajectory, Demo Mode & OpenAPI](#8--pwa-net-worth-trajectory-demo-mode--openapi-phase-8)
  - [9. Hardened Security, 2FA & Audit Logs](#9--hardened-security-2fa--audit-logs-phase-9)
- [🛠️ Architecture & Tech Stack](#️-architecture--tech-stack)
- [📡 API Reference](#-api-reference)
- [🚀 Local Development Setup](#-local-development-setup)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [☁️ Cloud Deployment Guide](#️-cloud-deployment-guide)
  - [Frontend Deployment (Vercel)](#deploying-frontend-to-vercel)
  - [Backend Deployment (Render)](#deploying-backend-to-render)
- [🧪 Automated Test Suite](#-automated-test-suite)
- [📄 License](#-license)

---

## 🌟 Overview

**Orbit** is a high-performance personal finance tracking and wealth intelligence application designed to give you clarity and control over your money. From granular daily expense logging to atomic inter-account transfers, subscription tracking, rule-based spending insights, and multi-factor security, Orbit combines clean minimalist aesthetics with banking-grade robustness.

Designed with **Dark Mode** and **Light Mode** first-class support, Orbit pairs an intuitive floating capsule navigation with real-time visual analytics, category budgeting, and multi-institution portfolio management.

---

## ✨ Key Features (Phases 1–9)

### 1. 🔄 Atomic Account Transfers (Phase 1)
- **Dedicated Transfer Transaction Type**: Move funds seamlessly between any two financial institutions (e.g., from *HDFC Salary Account* to *Cash Wallet*).
- **Atomic MongoDB Transactions**: Powered by MongoDB sessions/transactions ensuring both source deduction and destination credit execute together atomically or rollback on error.
- **Cashflow Integrity**: Internal transfers are excluded from income and expense velocity and category charts, keeping your true monthly cashflow and net worth accurate.
- **Distinct Visual History**: Transfers display clear source-to-destination direction badges with directional indicator icons.

### 2. 🔁 Subscriptions & Recurring Engine (Phase 2)
- **Flexible Scheduling**: Configure recurring rules by frequency (daily, weekly, monthly, yearly) with start dates and optional expiry dates.
- **Sleep-Resilient Catch-Up**: Overcomes Render free-tier sleep cycles by automatically running idempotent catch-up routines whenever the user logs in or loads the dashboard.
- **Committed Spend Overview**: Real-time calculation of total monthly committed subscription spend, upcoming renewals, and instant pause/resume/delete toggles.

### 3. 🎯 Budgets & "Safe to Spend" Intelligence (Phase 3)
- **Monthly Category Budgets**: Set spending caps per category with responsive progress indicators.
- **In-App Threshold Alerts**: Visual warning banners automatically trigger at **80%** (nearing budget limit) and **100%** (budget exceeded).
- **Safe-to-Spend per Day**: An intelligent daily spending allowance calculated dynamically based on your remaining budget and days left in the current calendar month.

### 4. 📁 CSV Batch Import & Sanitized Export (Phase 4)
- **Sanitized CSV Export**: Download transaction history with custom date ranges, accounts, and category filters.
- **Smart Column-Mapping Import**: Drag-and-drop CSV uploads with auto-detected columns (`Date`, `Amount`, `Description`, `Category`, `Account`).
- **Duplicate Hash Detection**: Automatically computes a SHA-256 fingerprint (`date + amount + description + account`) to detect and flag duplicate rows before committing.
- **Interactive Dry-Run Preview**: Inspect parsed rows, validation warnings, and duplicate flags in a responsive table prior to database insertion.

### 5. 🔍 Advanced Search, Filters & Tagging (Phase 5)
- **Multi-Field Free-Text Search**: Instant search matching across transaction notes and hashtags.
- **Hashtags & Notes**: Attach custom tags to transactions (e.g. `#groceries`, `#dining`, `#vacation`) with badge rendering.
- **Compound Filters**: Filter transactions by date range, account, type (expense/income/transfer), tag, and min/max amount.
- **Server-Side Pagination**: Indexed queries (`{ user: 1, date: -1 }`, `{ user: 1, tags: 1 }`) ensuring sub-millisecond response times even with thousands of entries.

### 6. 🏆 Savings Goals & Smart Spending Insights (Phase 6)
- **Target Savings Goals**: Define milestone goals with target amounts, target completion dates, and live visual progress bars.
- **Suggested Monthly Contribution**: Calculates exactly how much you must save each month to achieve each goal on time.
- **Quick Goal Deposits**: One-click modal to allocate savings directly from your active bank accounts into your goal fund.
- **Rule-Based Smart Insights**:
  - MoM category spending surge detection (e.g. *"Food & Dining spend is up 32% vs last month"*).
  - Weekday vs. Weekend spending velocity comparison.
  - Overall savings rate analysis.

### 7. ⚡ Quick Add via Natural Language (Phase 7)
- **Deterministic Text Parser**: Parses natural input strings like `"chai 40 yesterday"` or `"zomato 450 food"` into structured transaction drafts.
- **Zero-Latency Live Preview**: Visual confirmation chips show parsed amount, category, account, and date in real-time before saving.
- **1-Click Save**: Add expenses without opening forms or navigating away from the dashboard.

### 8. 📱 PWA, Net Worth Trajectory, Demo Mode & OpenAPI (Phase 8)
- **Progressive Web App (PWA)**: Installable directly on iOS, Android, macOS, and Windows with web manifest and service worker.
- **Offline Sync Queue**: Record transactions even with zero internet connectivity; transactions queue locally and sync automatically when network returns.
- **Net Worth Historical Trajectory**: 6-month historical net worth curve visualizing portfolio growth alongside liabilities (loans, credit card dues).
- **1-Click Demo Sandbox**: Explore the full application with pre-seeded accounts, transactions, subscriptions, and budgets without signing up.
- **Interactive OpenAPI / Swagger Documentation**: Full OpenAPI 3.0.3 specification available at `/api/docs` and `/api/docs/openapi.json`.
- **Automated CI/CD**: GitHub Actions workflow (`.github/workflows/ci.yml`) running backend test suites and frontend production verification builds on each commit.

### 9. 🛡️ Hardened Security, 2FA & Audit Logs (Phase 9)
- **Refresh Token Rotation**: Short-lived access tokens paired with rotating refresh tokens stored in secure, `httpOnly`, `sameSite` cookies with family reuse detection.
- **Per-Route Rate Limiting**: Dedicated rate limiters on authentication endpoints, token refresh, and batch CSV imports to prevent brute-force attacks and abuse.
- **Two-Factor Authentication (2FA)**: RFC 6238 TOTP two-factor authentication compatible with Google Authenticator, Apple Passwords, and Authy, complete with 8 emergency recovery backup codes.
- **Security Audit Logging**: Immutable audit log table recording logins, logouts, 2FA modifications, token rotations, and sensitive operations.
- **NoSQL Injection & HPP Prevention**: Automatic sanitization stripping MongoDB operators (`$gt`, `$where`, `$ne`) and prototype pollution vectors from all requests.

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
│   │   ├── __tests__/          # Automated test suite (node:test)
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

### Stack Breakdown

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, React Router v7 |
| **Backend** | Node.js 20+, Express 4, Mongoose 8, Zod, JWT, bcryptjs, Helmet, Express Rate Limit |
| **Database** | MongoDB Atlas with Replica Set / Distributed Transactions |
| **CI/CD** | GitHub Actions (`.github/workflows/ci.yml`) |
| **Hosting** | Vercel (Client SPA) + Render (Node.js Web Service) |

---

## 📡 API Reference

Explore the full interactive Swagger documentation at `/api/docs`. Below is a summary of primary endpoints:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and uptime | No |
| `GET` | `/api/docs/openapi.json` | OpenAPI 3.0.3 specification JSON | No |
| `GET` | `/api/docs` | Interactive Swagger API documentation UI | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login with email & password | No |
| `POST` | `/api/auth/login/2fa` | Complete 2FA login verification | No (Temp Token) |
| `POST` | `/api/auth/refresh` | Rotate refresh token & issue new access token | Cookie / Body |
| `POST` | `/api/auth/demo` | 1-Click Demo session with pre-seeded data | No |
| `POST` | `/api/auth/logout` | Invalidate tokens and clear auth cookies | Yes |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `POST` | `/api/auth/2fa/setup` | Generate TOTP secret and QR code URI | Yes |
| `POST` | `/api/auth/2fa/verify` | Verify and activate TOTP 2FA | Yes |
| `GET` | `/api/auth/audit-logs` | Retrieve recent security audit events | Yes |
| `GET` | `/api/accounts` | List accounts with live balances | Yes |
| `POST` | `/api/accounts` | Create bank account, card, wallet, or liability | Yes |
| `GET` | `/api/transactions` | Query transactions with filters, search, & tags | Yes |
| `POST` | `/api/transactions` | Log expense, income, or atomic transfer | Yes |
| `GET` | `/api/recurring` | List subscriptions and committed spend | Yes |
| `POST` | `/api/recurring` | Create recurring transaction schedule | Yes |
| `GET` | `/api/budgets` | Get category budgets & safe-to-spend figure | Yes |
| `GET` | `/api/goals` | List savings goals & suggested monthly savings | Yes |
| `GET` | `/api/analytics/trends` | 6-month cashflow velocity & net worth trend | Yes |
| `GET` | `/api/analytics/insights` | Rule-based smart spending insights | Yes |
| `GET` | `/api/export/csv` | Download sanitized CSV transaction export | Yes |
| `POST` | `/api/export/import/preview` | Preview CSV rows with column auto-detection | Yes |
| `POST` | `/api/export/import` | Commit batch imported transactions atomically | Yes |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** >= 18.0.0 (Node 20+ recommended)
- **npm** >= 9.0.0
- **MongoDB** instance (local daemon or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### 2. Clone the Repository
```bash
git clone https://github.com/sayanthkv/Orbit.git
cd Orbit
```

### 3. Backend Setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/orbit?retryWrites=true&w=majority
JWT_SECRET=super_secret_orbit_jwt_key_development_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
```

Start backend development server:
```bash
npm run dev
```

Run test suite:
```bash
npm test
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```

Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start frontend development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Environment Configuration

### Backend (`server/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | HTTP port for Express server | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `development` |
| `MONGO_URI` | MongoDB connection string (Atlas or local) | `mongodb+srv://...` |
| `JWT_SECRET` | Cryptographic secret for signing JWT tokens | `your_random_secret_here` |
| `JWT_EXPIRES_IN` | Access token lifespan | `7d` (or `15m` with refresh token rotation) |
| `CLIENT_URL` | Allowed CORS origin (Frontend URL) | `https://your-orbit-frontend.vercel.app` |
| `COOKIE_SECURE` | Set `true` in production to enforce HTTPS cookies | `true` |

### Frontend (`client/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base API endpoint URL consumed by Axios | `https://your-orbit-backend.onrender.com/api` |

---

## ☁️ Cloud Deployment Guide

### Deploying Frontend to Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your **Orbit** repository.
4. Set **Root Directory** to `client`.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://your-render-backend.onrender.com/api`
6. Click **Deploy**. Vercel will build and serve your SPA. Routing is pre-configured via `client/vercel.json`.

### Deploying Backend to Render

1. Log in to [Render](https://dashboard.render.com) and click **"New Web Service"**.
2. Connect your **Orbit** GitHub repository.
3. Configure service parameters:
   - **Name**: `orbit-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Under **Environment Variables**, configure:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = `mongodb+srv://<user>:<pass>@your-cluster.mongodb.net/orbit?retryWrites=true&w=majority`
   - `JWT_SECRET` = `generate_a_long_random_64_char_string`
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_URL` = `https://orbit-eight-expense-tracker.vercel.app`
   - `COOKIE_SECURE` = `true`
5. Click **Create Web Service**. Render will install dependencies and start the Node process with reverse-proxy trust and SSL enabled.

---

## 🧪 Automated Test Suite

Orbit includes a zero-dependency automated test runner powered by Node's native `node:test` engine. It thoroughly tests all 9 phases:

```bash
cd server
npm test
```

### Verified Test Cases:
```
▶ Orbit Full-Stack Test Suite
  ▶ Phase 1: Transfers between accounts
    ✔ should calculate account balance adjustments atomically for transfers
    ✔ should exclude transfer transactions from income and expense category totals
  ▶ Phase 2: Recurring transactions and subscriptions
    ✔ should correctly advance nextRunDate according to frequency
    ✔ should compute monthly committed subscription spend accurately
  ▶ Phase 3: Budgets with alerts and safe to spend
    ✔ should trigger in-app alerts at 80% warning and 100% exceeded thresholds
    ✔ should correctly calculate safe-to-spend per day for rest of month
  ▶ Phase 4: CSV Import duplicate detection
    ✔ should detect duplicate transactions using sha256 hash
  ▶ Phase 5: Search, filters and tags
    ✔ should filter transactions by tag, min/max amount, and query string
  ▶ Phase 6: Savings goals and rule-based insights
    ✔ should calculate suggested monthly savings contribution for goals
  ▶ Phase 7: Quick add natural language parsing logic
    ✔ should parse "chai 40 yesterday" deterministically
    ✔ should parse "zomato 450 food" into amount and note
  ▶ Phase 8: OpenAPI documentation
    ✔ should provide complete OpenAPI 3.0.3 specification with all required routes
  ▶ Phase 9: Security upgrades
    ✔ should generate valid base32 TOTP secret
    ✔ should verify 6-digit TOTP code and reject invalid code
    ✔ should generate 8 secure backup codes and verify against SHA-256 hash
    ✔ should format standard otpauth:// URL for authenticator apps
✔ Orbit Full-Stack Test Suite (16/16 tests passing, 0 failures)
```

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute it for personal and commercial projects.
