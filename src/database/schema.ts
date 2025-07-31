import { articles } from './entities/article.entity';
import { follows } from './entities/follow.entity';
import { userFavoriteArticles } from './entities/user-favorite-articles';
import { users } from './entities/user.entity';
import { comments } from './entities/comment.entity';
import { tags } from './entities/tag.entity';

// Also keep the schema export for your app's use
export const schema = {
  users,
  follows,
  articles,
  userFavoriteArticles,
  comments,
  tags,
};
export type Schema = typeof schema;
