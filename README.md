# Smart Mailer

Smart Mailer is a tool designed to handle smart, automated email sending functionalities. This document provides setup instructions to get your development environment up and running.

## Project Overview

- **Deployed Version**: [Smart Mailer API Documentation](https://nus-smart-mailer.vercel.app/api/docs)
- **Technologies**: Node.js, PostgreSQL, Express.js, Vercel (for deployment)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (latest version)
- [PostgreSQL](https://www.postgresql.org/)

## From Source

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


## With Docker Compose
```
version: '3.8'

services:
  web:
    container_name: smartmailer
    image: notle1706/smartmailer:latest
    ports:
      - "3000:3000"  # Map container port 3000 to host port 3000
    environment:
      - DATABASE_URL=postgresql://postgres:ilovecs3103@db:5432/test_db # Replace to db user and password
      - SMTP_SERVER=smtp.gmail.com
      - SMTP_PORT=465
      - MAILER_PROGRAM_IP=http://localhost:3000  # Replace with the actual server URL
    depends_on:
      - db  # Ensure PostgreSQL starts before the web app

  db:
    container_name: postgres
    image: postgres
    restart: always
    environment:
      POSTGRES_USER: postgres # Replace with user
      POSTGRES_PASSWORD: ilovecs3103 # Replace with password
      POSTGRES_DB: test_db # Replace with name of the database
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql # Same directory as docker-compose.yaml

volumes:
  postgres-data:
```
1. Place the SQL init script into the same directory as the docker-compose file
```
curl https://gist.githubusercontent.com/notle1706/b13d9abc75c40b70f1bba729c93a7405/raw/cab0638da398e2787308ef7ebc24d981ea533b56/init.sql > init.sql
```
2. Start the containers
```
docker compose up
```
3. Open your browser and visit http://localhost:3000/api/docs to access the app.

---

🔴 **Note:** On local development, we are unable to track if the recipient has opened the email.

---
