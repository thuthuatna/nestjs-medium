import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'username', description: 'Username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'password123', description: 'Password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    example: 'I am a developer',
    description: 'User bio',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  bio?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    description: 'Profile image URL',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  image?: string | null;
}

export class UpdateUserRequestDto {
  @ApiProperty({
    description: 'put user data',
    type: UpdateUserDto,
  })
  user: UpdateUserDto;
}
