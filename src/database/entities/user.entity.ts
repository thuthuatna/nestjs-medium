import {
  pgTable,
  serial,
  text,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { timestamps } from '../columns.helpers';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { InferSelectModel, relations } from 'drizzle-orm';
import { articles } from './article.entity';
import { userFavoriteArticles } from './user-favorite-articles';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 100 }).notNull().unique(),
    bio: text('bio'),
    image: varchar('image', { length: 500 }),
    password: varchar('password', { length: 255 }).notNull(),
    ...timestamps,
  },
  (users) => [
    uniqueIndex('email_idx').on(users.email),
    uniqueIndex('username_idx').on(users.username),
  ],
);

export const userRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  favorites: many(userFavoriteArticles),
}));

// Schema for inserting a user - can be used for validation
export const insertUserSchema = createInsertSchema(users);

// Schema for selecting a user - can be used for validation and type inference
export const selectUserSchema = createSelectSchema(users);

// TypeScript type for a user
export type User = InferSelectModel<typeof users>;
