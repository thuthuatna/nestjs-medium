import { User } from '../../../database/entities/user.entity';

export type JwtPayloadType = Pick<User, 'email' | 'username'> & {
  userId: number;
  email: string;
  username: string;
};
