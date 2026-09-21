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

---

## Testing & Verification Walkthrough

Once both the server and client are running, follow these steps to test each feature:

1. **Authentication**:
   - Navigate to `http://localhost:5173`.
   - Enter `admin` and `AdminPassword123!`, then click **Log in**.
   - Verify redirect to the main dashboard displaying user `@admin`.
2. **Dashboard Summary & Metrics**:
   - Verify the 4 summary statistics cards at the top (*Total Assets*, *Total Inventory Value in ₱*, *Active Assets*, *In Repair*).
3. **Create Asset**:
   - Click the **+ Add Asset** button in the toolbar.
   - Fill in the required fields (Asset Name, Category, Serial Number, Status, Estimated Value).
   - Click **Create** and verify the new row appears immediately in the table and metrics update.
4. **Search & Filter**:
   - Type an asset name or serial number into the search bar to test real-time filtering.
   - Filter by status using the dropdown (*Active*, *In Repair*, *Retired*).
5. **Update Asset**:
   - Click **Edit** on any row.
   - Verify all fields are pre-filled with existing data.
   - Change the status or value and click **Update** to verify the table reflects the change.
6. **Delete Asset**:
   - Click **Delete** on a row.
   - Verify the Ant Design `Popconfirm` warning appears.
   - Click **Yes, delete** to confirm removal and verify the row and count update.
7. **Report Export**:
   - Click **Export CSV** in the toolbar to download the current table dataset as a `.csv` file.
8. **Logout**:
   - Click **Log out** in the top navigation header to terminate the session.

---

## Challenges Encountered & Solutions

1. **SQL Server TCP/IP and Authentication Configuration**:
   - *Challenge*: SQL Server Express installations often have TCP/IP protocol disabled by default and only allow Windows Authentication, causing connection timeouts when connecting from Node.js `mssql`.
   - *Solution*: Enabled TCP/IP protocol on static port `1433` in SQL Server Configuration Manager, enabled Mixed Mode (SQL Server and Windows Authentication), and provisioned a dedicated database user with `db_owner` permissions on `AssetTrackerDB`.

2. **Form Pre-fill Synchronization in Modal Dialogs**:
   - *Challenge*: In Ant Design, calling `form.setFieldsValue()` before modal open animations finish can result in unmounted inputs failing to receive their values when switching between different asset records.
   - *Solution*: Bound a dynamic `key` matching the record ID (`key={initialValues ? 'edit-' + initialValues.Id : 'new'}`) and passed `initialValues` directly to the `<Form>` component. This ensures React remounts the form synchronously with the selected asset's values.

3. **Duplicate Serial Number Handling on Updates**:
   - *Challenge*: The database enforces a `UNIQUE` constraint on `SerialNumber`. When updating other attributes of an existing asset without modifying its serial number, a naive uniqueness check would throw a false-positive conflict error.
   - *Solution*: Added an exclusionary parameter in the duplicate check query (`WHERE SerialNumber = @SerialNumber AND Id != @Id`), allowing an asset to keep its own serial number while preventing conflicts with any other registered asset.

4. **Lightweight Client-side CSV Export**:
   - *Challenge*: Generating CSV exports without pulling in large external spreadsheet libraries that inflate bundle size.
   - *Solution*: Implemented a clean, pure JavaScript export utility using `Blob` (`text/csv;charset=utf-8;`) and native download triggering with RFC 4180 quote-escaping to safely handle commas and special characters in asset names.

