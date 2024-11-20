import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/models/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? ''
  }
});