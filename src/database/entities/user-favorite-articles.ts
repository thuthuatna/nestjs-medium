import {
  InferInsertModel,
  InferSelectModel,
  relations,
  sql,
} from 'drizzle-orm';
import { integer, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';
import { articles } from './article.entity';
import { users } from './user.entity';

export const userFavoriteArticles = pgTable(
  'user_favorite_articles',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    articleId: integer('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),

    createdAt: timestamp('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.userId, table.articleId] })],
);

// Define relations for better querying
export const userFavoriteArticlesRelations = relations(
  userFavoriteArticles,
  ({ one }) => ({
    user: one(users, {
      fields: [userFavoriteArticles.userId],
      references: [users.id],
    }),
    article: one(articles, {
      fields: [userFavoriteArticles.articleId],
      references: [articles.id],
    }),
  }),
);

export type UserFavoriteArticle = InferSelectModel<typeof userFavoriteArticles>;
export type NewUserFavoriteArticle = InferInsertModel<
  typeof userFavoriteArticles
>;
