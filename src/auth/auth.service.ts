import {
  HttpStatus,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { EmailLoginDto } from './dtos/email-login.dto';
import { ResponseUserDto } from './dtos/response-user.dto';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    const savedUser = await this.usersService.create(createUserDto);

    // Generate tokens
    const payload: JwtPayloadType = {
      userId: savedUser.id,
      email: savedUser.email,
      username: savedUser.username,
    };

    const accessToken = await this.generateAccessToken(payload);

    return {
      email: savedUser.email,
      username: savedUser.username,
      token: accessToken,
      bio: savedUser.bio || null,
      image: savedUser.image || null,
    };
  }

  async login(emailLoginDto: EmailLoginDto): Promise<ResponseUserDto> {
    const { email, password } = emailLoginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNAUTHORIZED,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const payload: JwtPayloadType = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = await this.generateAccessToken(payload);

    return {
      email: user.email,
      username: user.username,
      token: accessToken,
      bio: user.bio || null,
      image: user.image || null,
    };
  }

  async generateAccessToken(payload: JwtPayloadType): Promise<string> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const tokenExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '1h',
    );

    return await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: tokenExpiresIn,
    });
  }
}
