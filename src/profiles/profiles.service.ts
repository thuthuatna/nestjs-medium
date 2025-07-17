import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { follows } from '../database/entities/follow.entity';
import { users } from '../database/entities/user.entity';
import { IProfileResponse } from './types/profile-response.interface';

@Injectable()
export class ProfilesService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async getProfile(
    currentUserId: number | undefined,
    profileUsername: string,
  ): Promise<IProfileResponse> {
    const profileResults = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.username, profileUsername));
    const profile = profileResults.pop();
    if (!profile) {
      throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);
    }

    let following = false;
    if (currentUserId) {
      const follow = await this.drizzleService.db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, currentUserId),
            eq(follows.followingId, profile.id),
          ),
        );
      following = Boolean(follow.length);
    }
    return {
      profile: {
        email: profile.email,
        bio: profile.bio,
        image: profile.image,
        following: following,
      },
    };
  }

  async followProfile(
    currentUserId: number,
    followingUsername: string,
  ): Promise<IProfileResponse> {
    const profileResults = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.username, followingUsername));
    const profile = profileResults.pop();
    if (!profile) {
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);
    }

    if (currentUserId === profile.id) {
      throw new HttpException(
        'You cannot follow yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const followResults = await this.drizzleService.db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, profile.id),
        ),
      );

    if (!followResults.length) {
      await this.drizzleService.db.insert(follows).values({
        followerId: currentUserId,
        followingId: profile.id,
      });
    }
    return {
      profile: {
        email: profile.email,
        bio: profile.bio,
        image: profile.image,
        following: true,
      },
    };
  }

  async unfollowProfile(
    currentUserId: number,
    followingUsername: string,
  ): Promise<IProfileResponse> {
    const profileResults = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.username, followingUsername));
    const profile = profileResults.pop();
    if (!profile) {
      throw new HttpException('Profile does not exist', HttpStatus.NOT_FOUND);
    }

    if (currentUserId === profile.id) {
      throw new HttpException(
        'You cannot unfollow yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const followResults = await this.drizzleService.db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, profile.id),
        ),
      );

    if (followResults.length) {
      await this.drizzleService.db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, currentUserId),
            eq(follows.followingId, profile.id),
          ),
        );
    }
    return {
      profile: {
        email: profile.email,
        bio: profile.bio,
        image: profile.image,
        following: false,
      },
    };
  }
}
