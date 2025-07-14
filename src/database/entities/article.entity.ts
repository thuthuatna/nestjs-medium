import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestamps } from '../columns.helpers';
import { users } from './user.entity';

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  body: text('body').notNull(),
  tagList: text('tag_list').notNull().default('[]'),
  favorited: integer('favorited').notNull().default(0),
  favoritesCount: integer('favorites_count').notNull().default(0),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const articleRelations = relations(articles, ({ one }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
}));

export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);

export type Article = InferSelectModel<typeof articles>;
export type NewArticle = InferInsertModel<typeof articles>;
