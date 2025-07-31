import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EmailLoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class EmailLoginRequestDto {
  @ApiProperty({
    description: 'login data',
    type: EmailLoginDto,
  })
  user: EmailLoginDto;
}
