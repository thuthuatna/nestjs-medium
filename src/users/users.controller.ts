import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/user.decorator';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  async getUser(@Request() request, @CurrentUser() user: JwtPayloadType) {
    // Extract the token from the Authorization header
    const authHeader = request.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    // Pass both user payload and token to the service
    const userData = await this.usersService.getMe(user, token);

    // Return the user data wrapped in a 'user' object for consistent API response format
    return { user: userData };
  }

  @Put('')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Body('user') updateUserDto: UpdateUserDto,
    @Request() request,
    @CurrentUser('userId') userId: number, // Use userId from the decorator
  ) {
    // Extract the token from the Authorization header
    const authHeader = request.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    // Update the user and return the updated data
    const updatedUser = await this.usersService.updateUser(
      userId,
      updateUserDto,
      token,
    );

    return { user: updatedUser };
  }
}
