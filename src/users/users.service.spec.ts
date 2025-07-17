import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DrizzleService } from '../database/drizzle.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';

// Mock DrizzleService
const mockDrizzleService = {
  db: {
    select: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMe', () => {
    it('should return the current user', async () => {
      // Mock user data
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        bio: 'test bio',
        image: 'test-image.jpg',
        password: 'hashedPassword',
      };

      // Mock JWT payload
      const jwtPayload = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser',
      };

      // Mock the select method to return the user
      const selectMock = jest.fn().mockReturnThis();
      const fromMock = jest.fn().mockReturnThis();
      const whereMock = jest.fn().mockImplementation(() => {
        const isCorrectUser = jwtPayload.userId === mockUser.id;
        return Promise.resolve(isCorrectUser ? [mockUser] : []);
      });

      mockDrizzleService.db.select = selectMock;
      selectMock.mockReturnValue({ from: fromMock });
      fromMock.mockReturnValue({ where: whereMock });

      // Call the getMe method
      const result = await service.getMe(jwtPayload, 'testToken');

      // Assertions
      expect(result).toEqual({
        email: mockUser.email,
        username: mockUser.username,
        bio: mockUser.bio,
        image: mockUser.image,
        token: 'testToken',
      });

      // Verify that the select method was called correctly
      expect(selectMock).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalled();
      expect(whereMock).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Mock JWT payload
      const jwtPayload = {
        userId: 1,
        email: 'nonexistent@example.com',
        username: 'nonexistentuser',
      };

      // Mock the select method to return an empty array
      const selectMock = jest.fn().mockReturnThis();
      const fromMock = jest.fn().mockReturnThis();
      const whereMock = jest.fn().mockResolvedValue([]);

      mockDrizzleService.db.select = selectMock;
      selectMock.mockReturnValue({ from: fromMock });
      fromMock.mockReturnValue({ where: whereMock });

      // Expect the getMe method to throw a NotFoundException
      await expect(service.getMe(jwtPayload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      bio: 'test bio',
      image: 'test-image.jpg',
      password: 'hashedPassword',
    };

    const userId = 1;
    const token = 'testToken';

    beforeEach(() => {
      // Mock the select method to return the user
      const selectMock = jest.fn().mockReturnThis();
      const fromMock = jest.fn().mockReturnThis();
      const whereMock = jest.fn().mockResolvedValue([mockUser]);

      mockDrizzleService.db.select = selectMock;
      selectMock.mockReturnValue({ from: fromMock });
      fromMock.mockReturnValue({ where: whereMock });
    });

    it('should update the user bio and image', async () => {
      // Mock update data
      const updateUserDto: UpdateUserDto = {
        bio: 'updated bio',
        image: 'updated-image.jpg',
      };

      // Mock the update method
      const updateMock = jest.fn().mockReturnThis();
      const setMock = jest.fn().mockReturnThis();
      const updateWhereMock = jest.fn().mockReturnThis();
      const returningMock = jest.fn().mockResolvedValue([
        {
          ...mockUser,
          bio: updateUserDto.bio,
          image: updateUserDto.image,
        },
      ]);

      mockDrizzleService.db.update = updateMock;
      updateMock.mockReturnValue({ set: setMock });
      setMock.mockReturnValue({ where: updateWhereMock });
      updateWhereMock.mockReturnValue({ returning: returningMock });

      // Call the updateUser method
      const result = await service.updateUser(userId, updateUserDto, token);

      // Assertions
      expect(result).toEqual({
        email: mockUser.email,
        username: mockUser.username,
        bio: updateUserDto.bio,
        image: updateUserDto.image,
        token,
      });

      // Verify that the update method was called correctly
      expect(updateMock).toHaveBeenCalled();
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          bio: updateUserDto.bio,
          image: updateUserDto.image,
        }),
      );
      expect(updateWhereMock).toHaveBeenCalled();
      expect(returningMock).toHaveBeenCalled();
    });

    it('should update the user email after checking for duplicates', async () => {
      // Mock the findByEmail method to return null (no duplicate email)
      jest.spyOn(service, 'findByEmail').mockResolvedValue(null);

      // Mock update data
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      // Mock the update method
      const updateMock = jest.fn().mockReturnThis();
      const setMock = jest.fn().mockReturnThis();
      const updateWhereMock = jest.fn().mockReturnThis();
      const returningMock = jest.fn().mockResolvedValue([
        {
          ...mockUser,
          email: updateUserDto.email,
        },
      ]);

      mockDrizzleService.db.update = updateMock;
      updateMock.mockReturnValue({ set: setMock });
      setMock.mockReturnValue({ where: updateWhereMock });
      updateWhereMock.mockReturnValue({ returning: returningMock });

      // Call the updateUser method
      const result = await service.updateUser(userId, updateUserDto, token);

      // Assertions
      expect(result).toEqual({
        email: updateUserDto.email,
        username: mockUser.username,
        bio: mockUser.bio,
        image: mockUser.image,
        token,
      });

      // Verify that findByEmail was called
      expect(service.findByEmail).toHaveBeenCalledWith(updateUserDto.email);
    });

    it('should throw ConflictException when updating to an email that is already taken', async () => {
      // Mock the findByEmail method to return a user (duplicate email)
      jest.spyOn(service, 'findByEmail').mockResolvedValue({
        id: 2,
        email: 'newemail@example.com',
        username: 'anotheruser',
        password: 'hashedPassword',
        bio: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock update data
      const updateUserDto: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      // Expect the updateUser method to throw a ConflictException
      await expect(
        service.updateUser(userId, updateUserDto, token),
      ).rejects.toThrow(ConflictException);
    });

    it('should update the user password with a hashed version', async () => {
      // Mock bcrypt hash
      const hashedPassword = 'newHashedPassword';
      jest
        .spyOn(bcrypt, 'genSalt')
        .mockImplementation(() => Promise.resolve('salt' as never));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword as never));

      // Mock update data
      const updateUserDto: UpdateUserDto = {
        password: 'newPassword',
      };

      // Mock the update method
      const updateMock = jest.fn().mockReturnThis();
      const setMock = jest.fn().mockReturnThis();
      const updateWhereMock = jest.fn().mockReturnThis();
      const returningMock = jest.fn().mockResolvedValue([
        {
          ...mockUser,
          password: hashedPassword,
        },
      ]);

      mockDrizzleService.db.update = updateMock;
      updateMock.mockReturnValue({ set: setMock });
      setMock.mockReturnValue({ where: updateWhereMock });
      updateWhereMock.mockReturnValue({ returning: returningMock });

      // Call the updateUser method
      const result = await service.updateUser(userId, updateUserDto, token);

      // Assertions
      expect(result).toEqual({
        email: mockUser.email,
        username: mockUser.username,
        bio: mockUser.bio,
        image: mockUser.image,
        token,
      });

      // Verify that bcrypt methods were called
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, 'salt');

      // Verify that the update method was called with the hashed password
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          password: hashedPassword,
        }),
      );
    });

    it('should throw NotFoundException when user is not found', async () => {
      // Override the select method to return an empty array
      const selectMock = jest.fn().mockReturnThis();
      const fromMock = jest.fn().mockReturnThis();
      const whereMock = jest.fn().mockResolvedValue([]);

      mockDrizzleService.db.select = selectMock;
      selectMock.mockReturnValue({ from: fromMock });
      fromMock.mockReturnValue({ where: whereMock });

      // Mock update data
      const updateUserDto: UpdateUserDto = {
        bio: 'updated bio',
      };

      // Expect the updateUser method to throw a NotFoundException
      await expect(
        service.updateUser(userId, updateUserDto, token),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
