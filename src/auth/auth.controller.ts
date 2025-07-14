import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailLoginDto } from './dtos/email-login.dto';
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('')
  async register(@Body('user') createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  async login(@Body('user') emailLoginDto: EmailLoginDto) {
    return this.authService.login(emailLoginDto);
  }
}
