// src/routes/urlRoutes.ts
import { FastifyInstance } from 'fastify';
import { drizzle } from 'drizzle-orm/node-postgres';
import { urls, clicks } from '../db/models/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

interface ShortenUrlRequest {
  originalUrl: string;
  userId: string;
}

interface RedirectParams {
  shortId: string;
}

interface UrlStatsParams {
  id: string;
}

export const registerUrlRoutes = (fastify: FastifyInstance, db: ReturnType<typeof drizzle>) => {
  // Shorten URL endpoint
  fastify.post<{ Body: ShortenUrlRequest }>(
    '/shorten',
    {
      schema: {
        description: 'Create a shortened URL',
        tags: ['url'],
        summary: 'Creates a new short URL',
        body: {
          type: 'object',
          required: ['originalUrl', 'userId'],
          properties: {
            originalUrl: { 
              type: 'string',
              format: 'uri',
              description: 'The original URL to be shortened'
            },
            userId: { 
              type: 'string',
              format: 'uuid',
              description: 'ID of the user creating the short URL'
            },
          },
        },
        response: {
          201: {
            description: 'Short URL created successfully',
            type: 'object',
            properties: {
              id: { 
                type: 'string', 
                minLength: 8, 
                maxLength: 8
              },
              originalUrl: { 
                type: 'string', 
                format: 'uri'
              },
              shortUrl: { 
                type: 'string', 
                format: 'uri'
              },
            },
          },
          400: {
            description: 'Bad Request',
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          },
          500: {
            description: 'Internal Server Error',
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        },
      },
    },
    async (request, reply) => {
      const { originalUrl, userId } = request.body;

      if (!originalUrl || !userId) {
        return reply.status(400).send({ error: 'Original URL and User ID are required.' });
      }

      const randomBytes = crypto.randomBytes(4);
      const shortId = randomBytes.toString('hex');
      const shortUrl = `${request.protocol}://${request.hostname}/${shortId}`;

      try {
        const [newUrl] = await db.insert(urls)
          .values({
            id: shortId,
            originalUrl,
            shortUrl,
            userId,
          })
          .returning({
            id: urls.id,
            originalUrl: urls.originalUrl,
            shortUrl: urls.shortUrl,
          });

        return reply.status(201).send(newUrl);
      } catch (error) {
        console.error('Error creating shortened URL:', error);
        return reply.status(500).send({ error: 'Internal Server Error.' });
      }
    }
  );

  // URL Statistics endpoint
  fastify.get<{ Params: UrlStatsParams }>(
    '/urls/:id/stats',
    {
      schema: {
        description: 'Get URL statistics',
        tags: ['url'],
        summary: 'Retrieves statistics for a shortened URL',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Short URL identifier',
              minLength: 8,
              maxLength: 8
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', minLength: 8, maxLength: 8 },
              originalUrl: { type: 'string', format: 'uri' },
              shortUrl: { type: 'string', format: 'uri' },
              clickCount: { type: 'integer', minimum: 0 },
              lastClickedAt: { type: 'string', format: 'date-time' }
            }
          },
          404: {
            description: 'URL not found',
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          },
          500: {
            description: 'Internal Server Error',
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params;

      try {
        const [urlWithStats] = await db
          .select({
            id: urls.id,
            originalUrl: urls.originalUrl,
            shortUrl: urls.shortUrl,
            clickCount: clicks.clickCount,
            lastClickedAt: clicks.lastClickedAt
          })
          .from(urls)
          .leftJoin(clicks, eq(urls.id, clicks.urlId))
          .where(eq(urls.id, id));

        if (!urlWithStats) {
          return reply.status(404).send({ error: 'URL not found' });
        }

        return reply.send(urlWithStats);
      } catch (error) {
        console.error('Error fetching URL stats:', error);
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );

  // Redirect endpoint
  fastify.get<{ Params: RedirectParams }>(
    '/:shortId',
    {
      schema: {
        description: 'Redirect to original URL',
        tags: ['url'],
        summary: 'Redirects to the original URL and increments click count',
        params: {
          type: 'object',
          required: ['shortId'],
          properties: {
            shortId: {
              type: 'string',
              description: 'Short URL identifier',
              minLength: 8,
              maxLength: 8
            },
          },
        },
        response: {
          302: {
            description: 'Redirect to original URL',
            type: 'null'
          },
          404: {
            description: 'URL not found',
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          500: {
            description: 'Internal Server Error',
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        },
      },
    },
    async (request, reply) => {
      const { shortId } = request.params;

      try {
        const [urlRecord] = await db
          .select()
          .from(urls)
          .where(eq(urls.id, shortId));

        if (urlRecord) {
          await db
            .insert(clicks)
            .values({
              urlId: urlRecord.id,
              clickCount: 1,
              lastClickedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [clicks.urlId],
              set: {
                clickCount: sql`${clicks.clickCount} + 1`,
                lastClickedAt: new Date(),
              },
            });

          return reply.redirect(urlRecord.originalUrl);
        }

        return reply.status(404).send({ message: 'Shortened URL not found.' });
      } catch (error) {
        console.error('Error during redirection:', error);
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );
};