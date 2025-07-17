import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestamps } from '../columns.helpers';
import { users } from './user.entity';
import { userFavoriteArticles } from './user-favorite-articles';
import { comments } from './comment.entity';

export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  body: text('body').notNull(),
  tagList: text('tag_list').array().notNull().default([]),
  favoritesCount: integer('favorites_count').notNull().default(0),
  authorId: integer('author_id')
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const articleRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  favorites: many(userFavoriteArticles),
  comments: many(comments),
}));

export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);

export type Article = InferSelectModel<typeof articles>;
export type NewArticle = InferInsertModel<typeof articles>;
