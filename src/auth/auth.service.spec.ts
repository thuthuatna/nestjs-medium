import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { UnprocessableEntityException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let usersService: UsersService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return user data with token', async () => {
      // Mock data
      const createUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const savedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: null,
        image: null,
      };

      const accessToken = 'jwt-token';

      // Set up mocks
      mockUsersService.create.mockResolvedValue(savedUser);
      mockJwtService.signAsync.mockResolvedValue(accessToken);
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_EXPIRES_IN') return '1h';
        return null;
      });

      // Call the service method
      const result = await service.register(createUserDto);

      // Assertions
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          userId: savedUser.id,
          email: savedUser.email,
          username: savedUser.username,
        },
        {
          secret: 'test-secret',
          expiresIn: '1h',
        },
      );

      expect(result).toEqual({
        email: savedUser.email,
        username: savedUser.username,
        token: accessToken,
        bio: null,
        image: null,
      });
    });
  });

  describe('login', () => {
    it('should login a user and return user data with token', async () => {
      // Mock data
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: 'Test bio',
        image: 'test-image.jpg',
      };

      const accessToken = 'jwt-token';

      // Set up mocks
      mockUsersService.findByEmail.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync.mockResolvedValue(accessToken);
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_EXPIRES_IN') return '1h';
        return null;
      });

      // Call the service method
      const result = await service.login(loginDto);

      // Assertions
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalled();

      expect(result).toEqual({
        email: user.email,
        username: user.username,
        token: accessToken,
        bio: user.bio,
        image: user.image,
      });
    });

    it('should throw UnprocessableEntityException if email is not found', async () => {
      // Mock data
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      // Set up mocks
      mockUsersService.findByEmail.mockResolvedValue(null);

      // Call the service method and expect exception
      await expect(service.login(loginDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException if password is incorrect', async () => {
      // Mock data
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        bio: null,
        image: null,
      };

      // Set up mocks
      mockUsersService.findByEmail.mockResolvedValue(user);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      // Call the service method and expect exception
      await expect(service.login(loginDto)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a JWT access token', async () => {
      // Mock data
      const payload = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      const accessToken = 'jwt-token';

      // Set up mocks
      mockJwtService.signAsync.mockResolvedValue(accessToken);
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_EXPIRES_IN') return '1h';
        return null;
      });

      // Call the service method
      const result = await service.generateAccessToken(payload);

      // Assertions
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(mockConfigService.get).toHaveBeenCalledWith(
        'JWT_EXPIRES_IN',
        '1h',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(payload, {
        secret: 'test-secret',
        expiresIn: '1h',
      });
      expect(result).toEqual(accessToken);
    });

    it('should throw error if JWT_SECRET is not defined', async () => {
      // Mock data
      const payload = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      // Set up mocks
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'JWT_SECRET') return null;
        return null;
      });

      // Call the service method and expect exception
      await expect(service.generateAccessToken(payload)).rejects.toThrow(
        'JWT_SECRET is not defined',
      );
    });
  });
});
