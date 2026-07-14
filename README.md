# Personal Expense Tracker - Backend API (Node.js & PostgreSQL)

This is the backend server for the Personal Expense Tracker application, developed using Node.js, Express, and Prisma ORM accessing a PostgreSQL database.

The endpoints precisely match the routes and JSON structures required by the Flutter client.

---

## 🛠️ Tech Stack & Dependencies
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (validated with Prisma 7 config adapter)
- **ORM**: Prisma 7 Client & Driver Adapter
- **Security**: JWT & BcryptJS
- **Files**: Multer (saves uploaded media to `/uploads`)

---

## 📂 Project Structure
```
E:\SOPANHA\Documents\flutter-project\backend-final-project\
├── prisma/
│   ├── migrations/      - Database migration history
│   ├── schema.prisma    - Prisma ORM Data Models (no inline URLs)
│   └── seed.js          - Database seed script (test user & default categories)
├── src/
│   ├── config/
│   │   └── db.js        - Prisma Client Singleton using node-postgres
│   ├── middleware/
│   │   ├── auth.js      - JWT token parser and validator
│   │   ├── upload.js    - Multer configuration for file uploads
│   │   └── errorHandler.js - Catch-all global HTTP error handler
│   ├── controllers/     - Route controllers handling logic
│   ├── routes/          - API routes grouped by feature domain
│   ├── utils/           - Helpers (OTP, response envelopes, SMTP templates)
│   └── server.js        - Express server boots on Port 3000
├── prisma.config.js     - Prisma 7 configuration file
├── .env                 - Local config setup
├── package.json         - Node dependencies and scripts
└── README.md
```

---

## 🚀 Setup & Execution

### Prerequisites
- Node.js (v18+)
- PostgreSQL service running at `localhost:5433` (as per local database setup)

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Confirm `.env` configuration in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:admin@localhost:5433/expense_tracker?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   PORT=3000
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Seed the database with the default test user and category data:
   ```bash
   npm run seed
   ```

5. Run development server (with nodemon):
   ```bash
   npm run dev
   ```

---

## 🔑 Seeding Details & Test Credentials

Running `npm run seed` populates the database with:
- **Email**: `test@test.com`
- **Password**: `Pass123!`
- **Default Categories**: `Salary`, `Business`, `Rent`, `Food & Drinks`, `Shopping`, `Transportation`, `Entertainment`

---

## ⚙️ Connecting the Flutter App
To test this API with your Flutter client:
1. Open the Flutter project `final-project`.
2. Locate `lib/core/network/api_client.dart`.
3. Point the `defaultBaseUrl` to:
   ```dart
   static String get defaultBaseUrl => 'http://localhost:3000/api/v1';
   ```
4. Run the Flutter application on your Emulator/Device & sign in using the test credentials above.
