// src/routes/index.ts
import { FastifyInstance } from 'fastify';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { registerUserRoutes } from './userRoutes';
import { registerUrlRoutes } from './urlRoutes';

export const registerRoutes = (fastify: FastifyInstance, db: NodePgDatabase) => {
  registerUserRoutes(fastify, db);
  registerUrlRoutes(fastify, db);
};