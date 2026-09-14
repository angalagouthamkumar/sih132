# SIH26132 — Modules 1 & 2 Foundation & Authentication

This repository contains the foundational MERN architecture for SIH26132, structured into four independent applications:
* `farmer-frontend` — Farmer Portal (React 18 + Vite)
* `buyer-frontend` — Buyer Portal (React 18 + Vite)
* `admin-frontend` — Admin Portal (React 18 + Vite)
* `backend` — Shared Express.js API + MongoDB (Mongoose ODM)

---

## Directory Structure

```text
sih26132/
├── .gitignore
├── README.md
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── healthRoutes.js
│   ├── scripts/
│   │   └── seedAdmin.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── farmer-frontend/
│   ├── src/
│   │   ├── assets/{icons, images}/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── data/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── DashboardPlaceholder.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── StatusPage.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
├── buyer-frontend/
│   └── (identical independent Vite React structure with buyer signup & dashboard)
└── admin-frontend/
    └── (identical independent Vite React structure; login & dashboard only)
```

---

## Prerequisites

* **Node.js**: v18.0.0 or higher
* **MongoDB**: v6.0+ (running locally at `mongodb://127.0.0.1:27017/sih26132`)

---

## Environment Configuration

### Backend (`backend/.env`)
Create a `.env` file in `backend/` based on `backend/.env.example`:
```env
PORT=5000
MONGODB_URL=mongodb://127.0.0.1:27017/sih26132
CLIENT_URLS=http://localhost:5173,http://localhost:5174,http://localhost:5175
JWT_SECRET=your_jwt_secret_key_here

# Required for admin seeding:
ADMIN_NAME=Platform Administrator
ADMIN_EMAIL=admin@sih26132.com
ADMIN_PHONE=9876543210
ADMIN_PASSWORD=AdminPassword123
```

### Frontends (`.env` in each frontend directory)
Create a `.env` file in each frontend directory based on `.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Run Commands

### 1. Backend (`backend/`)
```bash
cd backend
npm install

# Seed administrator (required for admin console access):
npm run seed:admin

# Start development server:
npm run dev      # Starts nodemon on http://localhost:5000

# Production start:
# npm start
```

### 2. Farmer Portal (`farmer-frontend/`)
```bash
cd farmer-frontend
npm install
npm run dev      # Starts Vite on http://localhost:5173
# Production build & preview:
# npm run build && npm run preview
```

### 3. Buyer Portal (`buyer-frontend/`)
```bash
cd buyer-frontend
npm install
npm run dev      # Starts Vite on http://localhost:5174
# Production build & preview:
# npm run build && npm run preview
```

### 4. Admin Portal (`admin-frontend/`)
```bash
cd admin-frontend
npm install
npm run dev      # Starts Vite on http://localhost:5175
# Production build & preview:
# npm run build && npm run preview
```

---

## API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns health status and MongoDB connection status. |
| `POST` | `/api/auth/register` | Public | Register a `farmer` or `buyer` account with manual input validation. Returns safe user object and 7-day JWT. |
| `POST` | `/api/auth/login` | Public | Authenticate with email, password, and `expectedRole`. Rejects cross-portal logins (403). Returns safe user object and JWT. |
| `GET` | `/api/auth/me` | Protected | Returns current authenticated user profile based on `Bearer <token>`. Never exposes password hash. |

---

## Role Protection & Security Architecture

1. **Strict Role Locking**:
   * Each frontend accepts only its dedicated role (`farmer`, `buyer`, or `admin`).
   * Frontends supply `expectedRole` during login to ensure a farmer cannot authenticate into the Buyer or Admin portals, and vice versa.
   * On session restoration via `/api/auth/me`, the frontend verifies the role returned matches the portal. Any mismatch immediately clears `localStorage` and denies access.
2. **Admin Protection**:
   * No public admin registration endpoint. Public registrations attempting role `admin` are explicitly rejected with HTTP 400.
   * Admins are created exclusively through the backend script `npm run seed:admin` using environment variables.
3. **Password Security**:
   * Passwords hashed via `bcryptjs` with salt rounds = 10 prior to document save.
   * Password field is excluded by default (`select: false`) and stripped via custom `toJSON` model serialization.
4. **Token Security**:
   * JWT tokens contain only `{ id, role }`, signed with `JWT_SECRET`, valid for 7 days.
   * Bearer tokens are attached automatically to every outbound Axios request via request interceptors.
