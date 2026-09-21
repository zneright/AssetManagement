# Asset Management Tracker

A full-stack Asset Management and Tracking web application developed with **React (Vite)**, **Ant Design**, **Node.js / Express**, and **Microsoft SQL Server (MSSQL)**.

---

## Features

- **Authentication & Security**:
  - Secure login with bcrypt password hashing and JWT token issuance.
  - Protected API routes via Bearer token authorization middleware.
  - Persistent login session with automatic detection and redirect upon session expiration.
- **Asset Management (CRUD)**:
  - **Create**: Add new assets with full validation (Asset Name, Category, Serial Number, Status, Estimated Value).
  - **Read**: Dynamic Ant Design table displaying assets with category badges, status tags, and currency formatting in Philippine Peso (`₱`).
  - **Update**: Edit existing asset records with pre-populated form fields and duplicate serial exclusion.
  - **Delete**: Protected deletion flow with Ant Design inline `Popconfirm` dialog to prevent accidental data loss.
- **Search & Filter**:
  - Real-time client-side search by **Asset Name** or **Serial Number**.
  - Status dropdown filter (*All Statuses, Active, In Repair, Retired*).
  - Dynamic result counter.
- **Dashboard Metrics**:
  - Live summary statistics cards: **Total Assets**, **Total Inventory Value (₱)**, **Active Assets**, and **In Repair / Maintenance**.
  - Automatically re-calculates in real-time on any add, edit, or delete action.
- **Data Export**:
  - One-click CSV export (`Export CSV`) that extracts the active/filtered table dataset with proper RFC-compliant formatting.
- **Error Handling & UX**:
  - Toast feedback for all operations.
  - Server-side duplicate serial conflict detection (`409 Conflict`).
  - Graceful empty table states when no search results match.

---

## Tech Stack

- **Frontend**: React 19, Vite, Ant Design (antd v6), Axios
- **Backend**: Node.js (ES Modules), Express.js, `mssql`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`
- **Database**: Microsoft SQL Server (MSSQL Express / 2022 / 2025)

---

## Project Structure

```text
AssetManagement/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AssetModal.jsx  # Create & Edit modal form
│   │   │   ├── AssetTable.jsx  # Asset table, metrics cards & search
│   │   │   └── Login.jsx       # Authentication login form
│   │   ├── api.js              # Axios instance with auth interceptors
│   │   ├── App.jsx             # Dashboard layout & state management
│   │   └── main.jsx
│   └── package.json
├── server/                     # Backend Express API
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── db.js                   # MSSQL connection pool
│   ├── index.js                # Express app & REST API routes
│   ├── init.sql                # Database schema initialization script
│   ├── seed.js                 # Sample seed script for admin & initial assets
│   ├── .env.example            # Environment variable template
│   └── package.json
└── README.md
```

---

## Getting Started

### 1. Prerequisites

- **Node.js** (v18 or higher) and `npm`
- **Microsoft SQL Server** (SQL Server Express or Developer Edition) running on `localhost`

---

### 2. Database Setup

1. Open **SQL Server Management Studio (SSMS)** or `sqlcmd`.
2. Create the database and tables by running the provided SQL script:
   - Execute [`server/init.sql`](./server/init.sql) in your SQL Server instance.
   - This creates the `AssetTrackerDB` database and both `Users` and `Assets` tables with proper constraints and indexes.

---

### 3. Backend Setup

1. Open a terminal in the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file based on `.env.example`:
     ```bash
     cp .env.example .env
     ```
   - Update your MSSQL credentials in `.env`:
     ```env
     PORT=5000
     DB_SERVER=localhost
     DB_NAME=AssetTrackerDB
     DB_USER=asset_user
     DB_PASSWORD=YourPasswordHere!
     DB_PORT=1433
     DB_TRUST_SERVER_CERTIFICATE=true
     JWT_SECRET=your_super_secret_jwt_key_here
     ```

4. Seed the database with the default administrator and sample assets:
   ```bash
   npm run seed
   ```

5. Start the backend API:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`.

---

### 4. Frontend Setup

1. Open a new terminal in the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The client application will run at `http://localhost:5173`.

---

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `AdminPassword123!` |

---

## REST API Reference

All `/api/assets` endpoints require a valid Bearer Token in the `Authorization` header (`Authorization: Bearer <token>`).

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/login` | No | Authenticate user and receive JWT token |
| `GET` | `/api/assets` | Yes | Retrieve list of all registered assets |
| `GET` | `/api/assets/:id` | Yes | Retrieve single asset details by ID |
| `POST` | `/api/assets` | Yes | Register a new asset (validates duplicate serial number) |
| `PUT` | `/api/assets/:id` | Yes | Update asset record (checks serial conflicts excluding self) |
| `DELETE` | `/api/assets/:id` | Yes | Permanently remove an asset record |
| `GET` | `/api/health` | No | Health check endpoint |
