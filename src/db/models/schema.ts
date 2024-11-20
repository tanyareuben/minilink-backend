import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 15 }),
  profileImageUrl: text('profile_image_url'),
});

export const urls = pgTable('urls', {
  id: varchar('id', { length: 8 }).primaryKey(),
  originalUrl: text('original_url').notNull(),
  shortUrl: text('short_url').notNull().unique(),
  userId: uuid('user_id').references(() => users.id),
 });

 export const clicks = pgTable('clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  urlId: varchar('url_id', { length: 8 }).references(() => urls.id), // Changed to match urls.id type
  clickCount: integer('click_count').default(0),
  lastClickedAt: timestamp('last_clicked_at').defaultNow(),
 });

export const usersRelations = relations(users, ({ many }) => ({
  urls: many(urls),
}));

export const urlsRelations = relations(urls, ({ one, many }) => ({
  user: one(users, {
    fields: [urls.userId],
    references: [users.id],
  }),
  clicks: many(clicks),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  url: one(urls, {
    fields: [clicks.urlId],
    references: [urls.id],
  }),
}));