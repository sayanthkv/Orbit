# Orbit 🌌 — Personal Life Tools Suite

Orbit is a modular, multi-tool personal life web application built on the MERN stack with a plug-in architecture. It currently features a comprehensive **Expense Tracker** tool, with built-in slots for future modules (Smart Reminders, Quick Notes, Secure Vault).

---

## 🏗️ Architecture & Plug-in Design

Orbit is structured so that each new tool is added as an independent plug-in without modifying existing domain logic:

```text
/client
  src/
    app/            # Router, Providers (Auth, Theme), Master Layout
    components/     # Shared UI: Button, Input, Modal, Table, Spinner, Toast, EmptyState
    features/
      auth/         # Authentication & Session Management
      hub/          # Multi-tool launcher & personal dashboard
      expense-tracker/ # Expense Tracker module
        pages/      # Dashboard, Accounts, Cash, Transfers, Budgets, Recurring, Goals, Expenses
    lib/            # API client (Axios with interceptors), formatters, constants
    hooks/          # useDebounce, useMediaQuery
/server
  src/
    config/         # DB connection, CORS whitelist
    models/         # User, Account, CashProfile, Transaction, CashTransaction, Transfer, Budget, RecurringRule, Category, SavingsGoal, GoalContribution
    controllers/    # Business logic & aggregation pipelines
    routes/         # Modular route modules mounted in index.js
    middleware/     # Auth (JWT httpOnly cookie), Rate limiting, Sanitize, Validation, Errors
    validators/     # Zod input validation schemas
    services/       # Recurring transaction cron scheduler & catch-up engine
    utils/          # Balance calculation engine, category seeder, PDF/CSV generators
```

---

## 🌟 Expense Tracker Capabilities (10 Modules)

1. **Bank Accounts**:
   - First-time balance onboarding.
   - Live server-computed balances: `opening + income - expense + transfersIn - transfersOut`.
   - Account detail statement view with monthly metrics.
2. **Cash in Hand**:
   - Isolated from bank accounts; editable opening baseline.
   - Tracks cash flow and ATM withdrawals/deposits.
3. **Liquidity Transfers**:
   - Shift money between Bank $\leftrightarrow$ Bank, Bank $\leftrightarrow$ Cash (ATM / Deposit).
   - Validates available balance; does not distort income/expense charts.
4. **Monthly Category Budgets**:
   - Categorized limits with color warning states ($<80\%$ normal, $\ge 80\%$ warning, $\ge 100\%$ danger).
   - Aggregated across both bank accounts and cash in hand.
5. **Recurring Transactions**:
   - Idempotent scheduler runs daily and catches up on missed runs upon login or startup (resilient to Render free tier sleep).
6. **Custom & System Categories**:
   - Pre-seeded system categories + custom user categories.
   - Deletion safety: mandatory reassignment picker when deleting a category in active use.
7. **Tags & Global Search**:
   - Search notes, categories, tags, and amounts with `Ctrl/Cmd+K` command palette.
8. **Savings Goals**:
   - Allocation-only contribution engine with progress bars and monthly pace requirements.
9. **Monthly Statements (PDF & CSV)**:
   - Server-side branded statement generation (`pdfkit`) and CSV exports.
10. **Receipt Attachments**:
    - Upload JPG, PNG, WEBP, or PDF receipts via Cloudinary with automatic graceful fallback if credentials are omitted.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas connection string (or local MongoDB)

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

---

## 🔒 Security & Resilience
- **Auth**: Passwords hashed with `bcryptjs`, JWT stored in `httpOnly` secure cookies with `sameSite` policy.
- **Data Protection**: Strict per-user database queries (`user: req.user._id`).
- **NoSQL Injection**: Express query and body sanitizer strips dangerous `$` and `.` operators.
- **Rate Limiting**: Tiered limiters on auth and general API endpoints.
- **Input Validation**: Zod schemas strictly validate all payloads.
- **Sleep Resilience**: Idempotent recurring engine automatically runs catch-up when waking up from inactivity.
