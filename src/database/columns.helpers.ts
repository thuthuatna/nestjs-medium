import { timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
};

export const deletedAt = timestamp('deleted_at', { withTimezone: true });
