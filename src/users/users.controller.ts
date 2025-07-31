import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ResponseUserDto } from '../auth/dtos/response-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { CurrentUser } from '../common/decorators/user.decorator';
import { UpdateUserDto, UpdateUserRequestDto } from './dtos/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiSecurity('token')
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
  @ApiBody({ type: UpdateUserRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: ResponseUserDto,
  })
  async updateUser(
    @Body('user') updateUserDto: UpdateUserDto,
    @Request() request,
    @CurrentUser('userId') userId: number, // Use userId from the decorator
  ): Promise<ResponseUserDto> {
    // Extract the token from the Authorization header
    const authHeader = request.headers.authorization;
    const token = authHeader ? authHeader.split(' ')[1] : null;

    // Update the user and return the updated data
    const updatedUser = await this.usersService.updateUser(
      userId,
      updateUserDto,
      token,
    );

    return updatedUser;
  }
}
