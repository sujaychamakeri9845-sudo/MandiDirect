# MandiDirect - Hyper-Local Perishable Surplus Marketplace

MandiDirect connects small farmers and regional distributors with budget restaurants and juice shops to offload near-expiration surplus produce quickly and directly.

## Tech Stack
- **Frontend:** React + Tailwind CSS + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL

## Setup Instructions

Since Node.js and PostgreSQL are currently not installed on this machine, follow these steps to get the app running:

### 1. Install Prerequisites
- **Node.js:** Download and install from [nodejs.org](https://nodejs.org/).
- **PostgreSQL:** Download and install from [postgresql.org](https://www.postgresql.org/download/).

### 2. Configure Database
1. Open pgAdmin or use the `psql` command line tool.
2. Create a new database named `mandidirect`:
   ```sql
   CREATE DATABASE mandidirect;
   ```
3. Open `backend/.env` and update the credentials (password and user) to match your local PostgreSQL installation.

### 3. Start the Backend
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the server (it will automatically create the required database tables):
   ```bash
   npm run dev
   ```

### 4. Start the Frontend
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 5. View the App
Open your browser and navigate to `http://localhost:5173` to view the MandiDirect platform.
