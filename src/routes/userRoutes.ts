// src/routes/userRoutes.ts
import { FastifyInstance } from 'fastify';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users, urls, clicks } from '../db/models/schema';
import { eq } from 'drizzle-orm';

interface CreateUserRequest {
 firstName: string;
 lastName: string;
 email: string;
 phoneNumber?: string;
 profileImageUrl?: string;
}

export const registerUserRoutes = (fastify: FastifyInstance, db: NodePgDatabase) => {
 fastify.post<{ Body: CreateUserRequest }>(
   '/users',
   {
     schema: {
       description: 'Create a new user',
       tags: ['users'],
       summary: 'Creates a new user and returns their information',
       body: {
         type: 'object',
         required: ['firstName', 'lastName', 'email'],
         properties: {
           firstName: { 
             type: 'string',
             maxLength: 50,
             description: 'User\'s first name'
           },
           lastName: { 
             type: 'string',
             maxLength: 50,
             description: 'User\'s last name'
           },
           email: { 
             type: 'string',
             format: 'email',
             maxLength: 100,
             description: 'User\'s email address'
           },
           phoneNumber: { 
             type: 'string',
             maxLength: 15,
             description: 'User\'s phone number (optional)'
           },
           profileImageUrl: { 
             type: 'string',
             format: 'uri',
             description: 'URL to user\'s profile image (optional)'
           }
         }
       },
       response: {
         201: {
           description: 'User created successfully',
           type: 'object',
           properties: {
             id: { type: 'string', format: 'uuid' },
             firstName: { type: 'string', maxLength: 50 },
             lastName: { type: 'string', maxLength: 50 },
             email: { type: 'string', format: 'email', maxLength: 100 },
             phoneNumber: { type: 'string', maxLength: 15, nullable: true },
             profileImageUrl: { type: 'string', format: 'uri', nullable: true }
           }
         },
         400: {
           description: 'Bad Request',
           type: 'object',
           properties: {
             error: { type: 'string' }
           }
         },
         409: {
           description: 'Conflict - Email already exists',
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
     const { firstName, lastName, email, phoneNumber, profileImageUrl } = request.body;

     try {
       const insertValues = {
         firstName,
         lastName,
         email,
         phoneNumber: phoneNumber ?? null,
         profileImageUrl: profileImageUrl ?? null
       };

       const [newUser] = await db.insert(users)
         .values(insertValues)
         .returning({
           id: users.id,
           firstName: users.firstName,
           lastName: users.lastName,
           email: users.email,
           phoneNumber: users.phoneNumber,
           profileImageUrl: users.profileImageUrl
         });

       return reply.status(201).send(newUser);
     } catch (error) {
       console.error('Error creating user:', error);

       if (error instanceof Error && error.message.includes('duplicate key')) {
         return reply.status(409).send({ error: 'Email already exists' });
       }

       return reply.status(500).send({ error: 'Internal Server Error' });
     }
   }
 );

 fastify.get<{ Params: { userId: string } }>(
   '/users/:userId/urls',
   {
     schema: {
       description: 'Get user\'s URLs',
       tags: ['users'],
       summary: 'Retrieves all URLs created by a user with their statistics',
       params: {
         type: 'object',
         required: ['userId'],
         properties: {
           userId: {
             type: 'string',
             format: 'uuid',
             description: 'User ID'
           }
         }
       },
       response: {
         200: {
           description: 'List of user\'s URLs with statistics',
           type: 'array',
           items: {
             type: 'object',
             properties: {
               id: { 
                 type: 'string', 
                 minLength: 8, 
                 maxLength: 8,
                 description: 'Short URL identifier'
               },
               originalUrl: { 
                 type: 'string', 
                 format: 'uri',
                 description: 'Original URL'
               },
               shortUrl: { 
                 type: 'string', 
                 format: 'uri',
                 description: 'Shortened URL'
               },
               clicks: {
                 type: 'object',
                 properties: {
                   clickCount: { 
                     type: 'integer', 
                     minimum: 0,
                     description: 'Number of times the URL was clicked'
                   },
                   lastClickedAt: { 
                     type: 'string', 
                     format: 'date-time',
                     description: 'Timestamp of the last click'
                   }
                 }
               }
             }
           }
         },
         404: {
           description: 'User not found',
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
     const { userId } = request.params;

     try {
       // First check if user exists
       const [user] = await db
         .select()
         .from(users)
         .where(eq(users.id, userId));

       if (!user) {
         return reply.status(404).send({ error: 'User not found' });
       }

       // Get user's URLs with click statistics
       const userUrls = await db
         .select({
           id: urls.id,
           originalUrl: urls.originalUrl,
           shortUrl: urls.shortUrl,
           clicks: {
             clickCount: clicks.clickCount,
             lastClickedAt: clicks.lastClickedAt
           }
         })
         .from(urls)
         .leftJoin(clicks, eq(urls.id, clicks.urlId))
         .where(eq(urls.userId, userId));

       return reply.send(userUrls);
     } catch (error) {
       console.error('Error fetching user URLs:', error);
       return reply.status(500).send({ error: 'Internal Server Error' });
     }
   }
 );
};