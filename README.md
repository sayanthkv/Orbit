# Orbit 🪐

> **Modern Personal Finance & Expense Tracker**  
> Built with React 19, Tailwind CSS, Express, Node.js, and MongoDB Atlas.  
> Ready for seamless deployment on **Vercel** (Frontend) & **Render** (Backend).

---

## 🌟 Overview

**Orbit** is a modern, high-performance personal finance web application designed to help you track expenses, analyze cashflow trends, manage multi-bank accounts, and monitor your true net worth with a distraction-free, responsive interface.

Designed with both **Dark Mode** and **Light Mode** first-class support, Orbit pairs an intuitive floating capsule navigation with real-time analytics, interactive pie and bar charts, category budgeting, and multi-institution portfolio management.

---

## ✨ Key Features

### 1. 🏛️ Multi-Account & Portfolio Management
- **Dedicated Accounts Workspace**: Manage separate bank accounts, credit/debit cards, cash wallets, and savings deposits with custom bank names and masked account numbers (`•••• 9286`).
- **Single-Account Dashboard**: The home page isolates and tracks **one active account** at a time. Switch between accounts via the touch-friendly account switcher bar.
- **Dedicated Combined Portfolio Page (`/accounts/combined`)**: View-only aggregate portfolio showing your total calculated net worth, institution asset distribution, and unified multi-account chronological spending history.
- **Strictly View-Only Protection**: No accidental balance modification buttons in the combined view.

### 2. 📊 Interactive Graphs & Visual Analytics
- **Category Donut / Pie Chart with Type Switcher**:
  - Toggle between **Expense Breakdown** and **Income Sources** to visualize where money was spent or earned.
  - Interactive central total display, percentages, and hover tooltips.
- **Spending Velocity vs. Cumulative Burn Curve**:
  - Toggle between **Daily Outflow Spikes** (exact spending days) and **Cumulative Month-to-Date Burn** area curve.
- **6-Month Cash Flow Velocity Comparison**:
  - Side-by-side monthly bar chart comparing **Inflow (green)** vs **Outflow (rose)**.
  - Floating tooltip automatically computes and displays monthly **Net Savings**.
- **Portfolio Asset Allocation Pie Chart**:
  - Recharts donut chart on the Combined Portfolio page displaying the percentage spread across each connected bank account.

### 3. 💳 Responsive Modals & Quick Logging
- **Cinematic Backdrop Overlay**: High-blur backdrop (`backdrop-blur-md bg-black/75`) that keeps focus strictly on the entry modal.
- **Mobile-First Responsive Modals**:
  - Full-width touch targets with decimal numeric keypad trigger (`inputMode="decimal"`).
  - Dynamic headers for **Log Expense** vs **Log Income**.
  - Background scrolling is automatically locked when modals are open.
  - Responsive button stacks on mobile screens (`flex-col-reverse sm:flex-row`).

### 4. 🛡️ Industry-Standard Security Architecture
- **NoSQL Query Injection Sanitizer**: Automatically cleans `req.body`, `req.query`, and `req.params`, stripping any MongoDB injection operators (`$gt`, `$where`, `$ne`) and prototype pollution paths (`.`).
- **HTTP Parameter Pollution (HPP) Prevention**: Normalizes incoming query arrays to prevent parameter pollution.
- **Malformed ObjectId Validation**: Intercepts invalid IDs on routes (`/api/accounts/:id`, `/api/transactions/:id`) with clean `400 Bad Request` responses before Mongoose hits internal 500 CastErrors.
- **Helmet Security Headers**: Clickjacking protection (`frameguard: deny`), MIME-sniffing prevention (`noSniff`), XSS protection, and cross-origin resource policy.
- **Reverse Proxy Trust**: `app.set('trust proxy', 1)` enabled for secure HTTPS cookies and accurate IP rate limiting on Render and Cloudflare.
- **Credential Protection**: Explicit HTML5 `autoComplete` attributes on authentication forms for password manager integration.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, React Router v7 |
| **Backend** | Node.js, Express 4, Mongoose, Zod, JWT, bcryptjs, Helmet, Express Rate Limit |
| **Database** | MongoDB Atlas / Local MongoDB |
| **Hosting** | Vercel (Frontend SPA) + Render.com (Backend Web Service) |

---

## 📁 Project Structure

```text
Orbit/
├── vercel.json                    # Root Vercel deployment configuration
├── package.json                   # Monorepo scripts (dev runner)
├── README.md                      # Project documentation
├── server/                        # Express API Backend
│   ├── src/
│   │   ├── config/                # Database connection & CORS configuration
│   │   ├── controllers/           # account, transaction, analytics, budget controllers
│   │   ├── middleware/            # auth, errorHandler, validate, security (NoSQL & HPP)
│   │   ├── models/                # User, Account, Transaction, Category, Budget
│   │   ├── routes/                # Express API routes
│   │   ├── services/              # Default category seed service
│   │   ├── validations/           # Zod payload schemas
│   │   └── server.js              # Server entry point with reverse-proxy trust
│   └── .env                       # Backend environment variables
└── client/                        # React Vite Frontend
    ├── vercel.json                # Client-specific Vercel SPA rewrite rules
    ├── src/
    │   ├── api/                   # Axios API clients with dynamic VITE_API_URL resolution
    │   ├── components/
    │   │   ├── accounts/          # AccountCard, AccountFormModal, AssetAllocationPieChart
    │   │   ├── common/            # Button, Input, Select, Modal, ConfirmDialog, Skeleton
    │   │   ├── dashboard/         # HeroBalanceCard, CategoryDonutChart, SpendingTrendChart, CashflowTrendChart
    │   │   ├── layout/            # Navbar, BottomNav, AppLayout, ProtectedRoute
    │   │   └── transactions/      # TransactionItem, TransactionFormModal, TransactionFilters
    │   ├── context/               # AuthContext, ThemeContext, AccountContext, ToastContext
    │   ├── pages/                 # DashboardPage, AccountsPage, CombinedAccountsPage, TransactionsPage...
    │   └── utils/                 # Currency formatters, icon mapping, constants
    └── vite.config.js             # Vite build configuration
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- **npm** or **pnpm**
- **MongoDB Atlas** cluster URI

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Backend Environment (`server/.env`)
Create or edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/orbit?retryWrites=true&w=majority
JWT_SECRET=super_secret_orbit_jwt_key_development_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_SECURE=false
```

### 4. Run Locally
In separate terminals:

```bash
# Terminal 1: Start Backend (Port 5000)
cd server
npm run dev

# Terminal 2: Start Frontend (Port 5173)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🚢 Production Deployment Guide

### Part A: Deploying Backend on Render.com

1. **Create Web Service**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and click **New → Web Service**.
   - Connect your GitHub repository.
2. **Configure Service**:
   - **Name**: `orbit-backend` (or your chosen name)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js` (or `npm start`)
3. **Environment Variables**:
   Add the following in the **Environment** tab:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production cookie flags & security checks |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | *(Random 32+ character string)* | Secure secret key for signing JWTs |
   | `JWT_EXPIRES_IN` | `7d` | Token lifetime |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` | Your Vercel frontend URL (comma-separated if multiple) |
   | `COOKIE_SECURE` | `true` | Enforces HTTPS-only cookies |
4. **Deploy**:
   - Click **Create Web Service**.
   - Once deployed, copy your backend URL (e.g. `https://orbit-backend.onrender.com`).

---

### Part B: Deploying Frontend on Vercel

1. **Import Project**:
   - Go to [vercel.com](https://vercel.com/) and click **Add New → Project**.
   - Select your GitHub repository.
2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `client` (or leave as `./` — root `vercel.json` will route to `client` automatically).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   Add the following variable:
   | Key | Value | Notes |
   |---|---|---|
   | `VITE_API_URL` | `https://orbit-backend.onrender.com/api` | Point to your Render service URL with `/api` |
4. **Deploy**:
   - Click **Deploy**.
   - Your frontend will be live at `https://<your-project>.vercel.app`.
   - Update `CLIENT_URL` on Render to match this Vercel domain.

---

## 📡 REST API Reference

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/auth/register` | `POST` | Register a new user | Public |
| `/api/auth/login` | `POST` | Login & set secure auth cookie | Public |
| `/api/auth/me` | `GET` | Get authenticated profile | Private |
| `/api/auth/logout` | `POST` | Clear auth token cookie | Private |
| `/api/accounts` | `GET` | Get all accounts + aggregated summary | Private |
| `/api/accounts` | `POST` | Create a new bank/cash account | Private |
| `/api/accounts/:id` | `GET` | Get account details by ID | Private |
| `/api/accounts/:id` | `PUT` | Update bank account & baseline balance | Private |
| `/api/accounts/:id` | `DELETE`| Remove account (safely guarded if records exist)| Private |
| `/api/transactions` | `GET` | Filtered & paginated transactions | Private |
| `/api/transactions` | `POST` | Record an expense or income entry | Private |
| `/api/transactions/:id`| `PUT` | Update existing transaction record | Private |
| `/api/transactions/:id`| `DELETE`| Delete transaction | Private |
| `/api/analytics/summary` | `GET` | Inflow, Outflow, Balance & MoM delta | Private |
| `/api/analytics/category-breakdown` | `GET` | Category distribution for Donut/Pie charts | Private |
| `/api/analytics/trends` | `GET` | Daily velocity & 6-month cashflow data | Private |
| `/api/budgets` | `GET` | Category budget tracking & threshold alerts | Private |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
