import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtPayloadType } from 'src/auth/strategies/types/jwt-payload.type';

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
