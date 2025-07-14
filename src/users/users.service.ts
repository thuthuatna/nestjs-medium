import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { CreateUserDto } from 'src/auth/dtos/create-user.dto';
import { DrizzleService } from 'src/database/drizzle.service';
import { users } from 'src/database/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';
import { ResponseUserDto } from 'src/auth/dtos/response-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, username, password } = createUserDto;
    // Check if user with the email already exists
    const existingUsers = await this.drizzleService.db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)));

    if (existingUsers.length > 0) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const [savedUser] = await this.drizzleService.db
      .insert(users)
      .values({
        email,
        username,
        password: hashedPassword,
      })
      .returning();
    if (!savedUser) {
      throw new Error('Failed to create user');
    }
    return savedUser;
  }

  async findByEmail(email: string) {
    const [user] = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user || null;
  }

  async getMe(
    userJwtPayload: JwtPayloadType,
    token?: string,
  ): Promise<ResponseUserDto> {
    const userResults = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.id, userJwtPayload.userId));
    const user = userResults.pop();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      email: user.email,
      username: user.username,
      token: token || '',
      bio: user.bio || null,
      image: user.image || null,
    };
  }

  async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
    token?: string,
  ): Promise<ResponseUserDto> {
    // Check if user exists
    const userResults = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const user = userResults.pop();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    // Only add fields that are provided in the DTO
    if (updateUserDto.email !== undefined) {
      // Check if email is already taken by another user
      if (updateUserDto.email !== user.email) {
        const existingUser = await this.findByEmail(updateUserDto.email);
        if (existingUser) {
          throw new ConflictException('Email is already taken');
        }
      }
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.username !== undefined) {
      // Check if username is already taken by another user
      const existingUsers = await this.drizzleService.db
        .select()
        .from(users)
        .where(eq(users.username, updateUserDto.username));

      if (existingUsers.length > 0 && existingUsers[0].id !== userId) {
        throw new ConflictException('Username is already taken');
      }

      updateData.username = updateUserDto.username;
    }

    if (updateUserDto.password !== undefined) {
      // Hash the new password
      const salt = await bcrypt.genSalt();
      updateData.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    if (updateUserDto.bio !== undefined) {
      updateData.bio = updateUserDto.bio;
    }

    if (updateUserDto.image !== undefined) {
      updateData.image = updateUserDto.image;
    }

    // Update the user if there's anything to update
    if (Object.keys(updateData).length > 0) {
      const [updatedUser] = await this.drizzleService.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      return {
        email: updatedUser.email,
        username: updatedUser.username,
        token: token || '',
        bio: updatedUser.bio || null,
        image: updatedUser.image || null,
      };
    }

    // If no fields to update, return the current user data
    return {
      email: user.email,
      username: user.username,
      token: token || '',
      bio: user.bio || null,
      image: user.image || null,
    };
  }
}
