import { ApiProperty } from '@nestjs/swagger';

export class ResponseUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'JWT authentication token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'User bio information',
    example: 'Software developer passionate about Node.js',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: 'URL to user profile image',
    example: 'https://example.com/images/profile.jpg',
    nullable: true,
  })
  image: string | null;
}
