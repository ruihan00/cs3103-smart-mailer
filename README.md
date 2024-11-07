# Smart Mailer

Smart Mailer is a tool designed to handle smart, automated email sending functionalities. This document provides setup instructions to get your development environment up and running.

## Project Overview

- **Deployed Version**: [Smart Mailer API Documentation](https://nus-smart-mailer.vercel.app/api/docs)
- **Technologies**: Node.js, PostgreSQL, Express.js, Vercel (for deployment)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest version)
- [PostgreSQL](https://www.postgresql.org/)

### Step 1: Database Setup

1. **Install PostgreSQL** if it’s not already installed on your system.
2. Open `psql` and create a new database:
```sql
CREATE DATABASE mailer;
```
3. Run the initialization script to set up tables and default data.
```
sudo -u postgres psql -d mailer -f /path/to/cs3103-smart-mailer/init-scripts/init.sql
```
4. Ensure that PostgreSQL is running:
```
sudo systemctl status postgresql
```

### Step 2: Local Development
1. Clone this repository and navigate to the project directory.
```
git clone <repository-url>
cd smart-mailer
```
2. Install project dependencies.
```
npm install
```
3. Start the development server.
```
npm run dev
```
4. Update the .env file.
5. Open your browser and visit http://localhost:3000/api/docs to access the app.

---

🔴 **Note:** On local development, we are unable to track if the recipient has opened the email.

---
