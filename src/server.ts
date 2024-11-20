import Fastify from 'fastify';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import dotenv from 'dotenv';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { swaggerOptions, swaggerUiOptions } from './schemas/swagger';
import { registerRoutes } from './routes';

dotenv.config();

const port = process.env.PORT || 8080;

export const startServer = async () => {
  const fastify = Fastify({ logger: true });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  // Register Swagger plugins
  await fastify.register(swagger, swaggerOptions);
  await fastify.register(swaggerUi, swaggerUiOptions);

  // Register routes
  registerRoutes(fastify, db);

  // Start the server
  try {
    await fastify.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Swagger UI is available at http://localhost:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};