import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAuthGuard } from '../auth/option-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ProfilesService } from './profiles.service';
import { IProfileResponse } from './types/profile-response.interface';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @UseGuards(OptionalAuthGuard)
  getProfile(
    @CurrentUser('userId') currentUserId: number | undefined,
    @Param('username') profileUsername: string,
  ): Promise<IProfileResponse> {
    return this.profilesService.getProfile(currentUserId, profileUsername);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  followProfile(
    @CurrentUser('userId') currentUserId: number,
    @Param('username') profileUsername: string,
  ): Promise<IProfileResponse> {
    return this.profilesService.followProfile(currentUserId, profileUsername);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  unfollowProfile(
    @CurrentUser('userId') currentUserId: number,
    @Param('username') profileUsername: string,
  ): Promise<IProfileResponse> {
    return this.profilesService.unfollowProfile(currentUserId, profileUsername);
  }
}
