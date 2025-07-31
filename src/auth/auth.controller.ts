import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, CreateUserRequestDto } from './dtos/create-user.dto';
import { EmailLoginDto, EmailLoginRequestDto } from './dtos/email-login.dto';
import { ResponseUserDto } from './dtos/response-user.dto';

@ApiTags('Auth')
@Controller('users')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: ResponseUserDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 409,
    description: 'Email or username already exists',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'User with this email or username already exists',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 422 },
        errors: {
          type: 'object',
          example: {
            email: 'email should not be empty, email must be an email',
            username:
              'username must be longer than or equal to 3 characters, username should not be empty, username must be a string',
            password:
              'password must be longer than or equal to 8 characters, password should not be empty, password must be a string',
          },
        },
      },
    },
  })
  @Post('')
  async register(
    @Body('user') createUserDto: CreateUserDto,
  ): Promise<ResponseUserDto> {
    return this.authService.register(createUserDto);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBearerAuth()
  @ApiBody({ type: EmailLoginRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: ResponseUserDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Validation failed or email not found',
    schema: {
      properties: {
        status: { type: 'number', example: 422 },
        errors: {
          type: 'object',
          example: {
            email: 'Email not found',
            password: 'incorrectPassword',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('login')
  async login(
    @Body('user') emailLoginDto: EmailLoginDto,
  ): Promise<ResponseUserDto> {
    return this.authService.login(emailLoginDto);
  }
}
