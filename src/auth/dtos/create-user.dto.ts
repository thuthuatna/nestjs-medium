import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// This class represents the inner user object
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class CreateUserRequestDto {
  @ApiProperty({
    description: 'User data',
    type: CreateUserDto,
  })
  user: CreateUserDto;
}
