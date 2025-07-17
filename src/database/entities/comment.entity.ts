import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { timestamps } from '../columns.helpers';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { users } from './user.entity';
import { articles } from './article.entity';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  body: text('body').notNull(),
  authorId: serial('author_id')
    .references(() => users.id)
    .notNull(),
  articleId: serial('article_id')
    .references(() => articles.id)
    .notNull(),
  ...timestamps,
});

export const commentRelations = relations(comments, ({ one }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);

export type Comment = InferSelectModel<typeof comments>;
export type NewComment = InferInsertModel<typeof comments>;
