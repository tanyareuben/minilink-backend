# Minilink - URL Shortener Backend

Minilink is a URL shortener application. This repository contains the backend of the project, written in **TypeScript** and running on **Node.js**. The backend provides **REST APIs** for the Minilink app and uses **Fastify** as the HTTP server, **Drizzle ORM** for database interaction, and **Swagger UI** for API documentation.

The backend connects to a **PostgreSQL** database, and the application’s Swagger documentation is available at the `/docs` endpoint.

## Prerequisites

Before you can build and run the app, make sure you have the following software installed:

1. **Node.js version 18 or above**  
   To download and install Node.js, follow these instructions:
   - [Download Node.js](https://nodejs.org/)
   - Install the recommended LTS version.

2. **PostgreSQL**  
   You need to have a PostgreSQL database installed locally.  
   To install PostgreSQL, follow these steps:
   - [Download PostgreSQL](https://www.postgresql.org/download/)
   - Install PostgreSQL following the instructions for your operating system.

3. **pgAdmin** (optional, for database management)  
   pgAdmin is a popular PostgreSQL database management tool.  
   You can download it from:  
   - [Download pgAdmin](https://www.pgadmin.org/download/)

## Project Setup

Follow these steps to set up and run the Minilink backend:

### Step 1: Clone the Repo

Clone this repository to your local machine:

```bash
git clone https://github.com/yourusername/minilink.git
cd minilink
```
### Project Structure

The project has the following structure:
```
- dist/                 # Compiled output
- node_modules/         # Node.js dependencies
- src/                  # Source code
  - db/                 # Database-related files
    - migrations/       # Database migrations
    - models/           # Drizzle ORM models and schemas
  - .env                # Environment configuration
  - drizzle.config.ts   # Drizzle ORM configuration
  - package.json        # Project metadata and dependencies
  - README.md           # Project documentation
  - tsconfig.json       # TypeScript configuration
```

### Drizzle Schema
The database schema is defined using Drizzle ORM in the /src/models/schema.ts file. This file contains the structure for the database tables and relationships.

### Step 2: Install Dependencies

At the root of the project folder, run the following command to install the required dependencies:

```bash
npm install
```

### Step 3: Build the Project

Once the dependencies are installed, build the TypeScript project by running the following command:

```bash
npm run dev:build
```

### Step 4: Set up the Database

1. **Database Configuration**

Using PGAdmin create a new database called 'minilink' in Postgres running locally in your machine

Create a .env file at the root of the project with the following content:
```
DATABASE_URL=postgres://dbusername:password@localhost:5432/shortly
```
Make sure to replace yumuser and password with your actual PostgreSQL credentials.

Before running the app, you need to set up your PostgreSQL database:

2. **Run the Migrations**

   Run the following command to migrate the database schema and create the required tables in the database:

   ```bash
   npm run migrate
   ```
Run the following command to push the schema to the database:
```
npm run push
```
### Step 2: Install Dependencies

At the root of the project folder, run the following command to install the required dependencies:

```bash
npm install
```

This will install all the necessary dependencies listed in the package.json file, including libraries like Fastify, Drizzle ORM, and other packages needed for the backend to function properly.

### Step 5: Run the App

Now, you can run the backend app with the following command:

```bash
npm run dev
```

This will start the Fastify server and your API will be running on http://localhost:8080. You can now access the endpoints and interact with the backend.

## Swagger UI
You can access the Swagger UI for API documentation at:

```
http://localhost:8080/docs
```