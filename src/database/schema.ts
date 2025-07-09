import { follows } from './entities/follow.entity';
import { users } from './entities/user.entity';

// Also keep the schema export for your app's use
export const schema = {
  users,
  follows,
};
export type Schema = typeof schema;
