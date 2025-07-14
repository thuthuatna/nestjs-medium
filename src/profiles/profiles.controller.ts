import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { IProfileResponse } from './types/profile-response.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  getProfile(
    @CurrentUser('userId') currentUserId: number,
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
