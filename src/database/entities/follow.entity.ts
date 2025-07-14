import { pgTable, primaryKey, integer } from 'drizzle-orm/pg-core';
import { timestamps } from '../columns.helpers';
import { users } from './user.entity';
import { InferSelectModel, relations } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';

export const follows = pgTable(
  'follows',
  {
    followerId: integer('follower_id')
      .notNull()
      .references(() => users.id),
    followingId: integer('following_id')
      .notNull()
      .references(() => users.id),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.followerId, table.followingId] })],
);

// Set up relations between users and follows
export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: 'follower',
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: 'following',
  }),
}));

// Set up relations on users table
export const usersRelations = relations(users, ({ many }) => ({
  followers: many(follows, { relationName: 'following' }),
  following: many(follows, { relationName: 'follower' }),
}));

export const insertFollowSchema = createSelectSchema(follows);

export const selectFollowSchema = createSelectSchema(follows);

export type Follow = InferSelectModel<typeof follows>;
