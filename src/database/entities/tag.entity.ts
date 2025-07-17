import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from '../columns.helpers';

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  ...timestamps,
});
