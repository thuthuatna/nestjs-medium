import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { DrizzleService } from '../database/drizzle.service';
import { HttpException, HttpStatus } from '@nestjs/common';

// Mock DrizzleService
const mockDrizzleService = {
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ProfilesService', () => {
  let service: ProfilesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    const mockUser = {
      id: 2,
      email: 'john@example.com',
      username: 'john',
      bio: 'John bio',
      image: 'john-image.jpg',
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return a profile when profile exists and not following', async () => {
      // Mock user exists but not followed
      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockUser]);

      // Mock follow check returns empty array (not following)
      const selectFollowMock = jest.fn().mockReturnThis();
      const fromFollowMock = jest.fn().mockReturnThis();
      const whereFollowMock = jest.fn().mockResolvedValue([]);

      // Setup the mock chain for user query
      mockDrizzleService.db.select.mockImplementation(() => ({
        from: fromUserMock,
        where: whereUserMock,
      }));

      // Call getProfile with a currentUserId
      const result = await service.getProfile(1, 'john');

      // Assert the profile data is correct
      expect(result).toEqual({
        profile: {
          email: mockUser.email,
          bio: mockUser.bio,
          image: mockUser.image,
          following: false,
        },
      });
    });

    it('should return a profile when profile exists and is following', async () => {
      // Mock user exists
      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockUser]);

      // Mock follow check returns non-empty array (is following)
      const selectFollowMock = jest.fn().mockReturnThis();
      const fromFollowMock = jest.fn().mockReturnThis();
      const whereFollowMock = jest.fn().mockResolvedValue([{ id: 1 }]);

      // Setup the mock chain
      mockDrizzleService.db.select
        .mockImplementationOnce(() => ({
          from: fromUserMock,
          where: whereUserMock,
        }))
        .mockImplementationOnce(() => ({
          from: fromFollowMock,
          where: whereFollowMock,
        }));

      // Call getProfile with a currentUserId
      const result = await service.getProfile(1, 'john');

      // Assert the profile data is correct with following set to true
      expect(result).toEqual({
        profile: {
          email: mockUser.email,
          bio: mockUser.bio,
          image: mockUser.image,
          following: true,
        },
      });
    });

    it('should throw HttpException when profile does not exist', async () => {
      // Mock user does not exist
      const selectMock = jest.fn().mockReturnThis();
      const fromMock = jest.fn().mockReturnThis();
      const whereMock = jest.fn().mockResolvedValue([]);

      mockDrizzleService.db.select.mockImplementation(() => ({
        from: fromMock,
        where: whereMock,
      }));

      // Expect getProfile to throw HttpException with NOT_FOUND status
      await expect(service.getProfile(1, 'nonexistent')).rejects.toThrow(
        new HttpException('Profile not found', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('followProfile', () => {
    const mockUser = {
      id: 2,
      email: 'john@example.com',
      username: 'john',
      bio: 'John bio',
      image: 'john-image.jpg',
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should follow a profile when not already following', async () => {
      // Mock user exists
      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockUser]);

      // Mock follow check returns empty array (not already following)
      const selectFollowMock = jest.fn().mockReturnThis();
      const fromFollowMock = jest.fn().mockReturnThis();
      const whereFollowMock = jest.fn().mockResolvedValue([]);

      // Mock insert follow
      const insertMock = jest.fn().mockReturnThis();
      const valuesMock = jest.fn().mockResolvedValue(undefined);

      // Setup the mock chain
      mockDrizzleService.db.select
        .mockImplementationOnce(() => ({
          from: fromUserMock,
          where: whereUserMock,
        }))
        .mockImplementationOnce(() => ({
          from: fromFollowMock,
          where: whereFollowMock,
        }));

      mockDrizzleService.db.insert.mockImplementation(() => ({
        values: valuesMock,
      }));

      // Call followProfile
      const currentUserId = 1;
      const result = await service.followProfile(currentUserId, 'john');

      // Assert the profile data is correct with following set to true
      expect(result).toEqual({
        profile: {
          email: mockUser.email,
          bio: mockUser.bio,
          image: mockUser.image,
          following: true,
        },
      });

      // Verify insert was called with correct values
      expect(mockDrizzleService.db.insert).toHaveBeenCalled();
      expect(valuesMock).toHaveBeenCalledWith({
        followerId: currentUserId,
        followingId: mockUser.id,
      });
    });

    it('should not insert new follow when already following', async () => {
      // Mock user exists
      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockUser]);

      // Mock follow check returns non-empty array (already following)
      const selectFollowMock = jest.fn().mockReturnThis();
      const fromFollowMock = jest.fn().mockReturnThis();
      const whereFollowMock = jest.fn().mockResolvedValue([{ id: 1 }]);

      // Setup the mock chain
      mockDrizzleService.db.select
        .mockImplementationOnce(() => ({
          from: fromUserMock,
          where: whereUserMock,
        }))
        .mockImplementationOnce(() => ({
          from: fromFollowMock,
          where: whereFollowMock,
        }));

      // Call followProfile
      const currentUserId = 1;
      const result = await service.followProfile(currentUserId, 'john');

      // Assert the profile data is correct with following set to true
      expect(result).toEqual({
        profile: {
          email: mockUser.email,
          bio: mockUser.bio,
          image: mockUser.image,
          following: true,
        },
      });

      // Verify insert was not called
      expect(mockDrizzleService.db.insert).not.toHaveBeenCalled();
    });

    it('should throw HttpException when trying to follow yourself', async () => {
      // Mock user exists with same ID as current user
      const mockSelfUser = {
        ...mockUser,
        id: 1, // Same as currentUserId
      };

      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockSelfUser]);

      mockDrizzleService.db.select.mockImplementation(() => ({
        from: fromUserMock,
        where: whereUserMock,
      }));

      // Expect followProfile to throw HttpException with BAD_REQUEST status
      await expect(service.followProfile(1, 'john')).rejects.toThrow(
        new HttpException('You cannot follow yourself', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw HttpException when profile does not exist', async () => {
      // Mock user does not exist
      const selectMock = jest.fn().mockReturnThis();
      const fromMock = jest.fn().mockReturnThis();
      const whereMock = jest.fn().mockResolvedValue([]);

      mockDrizzleService.db.select.mockImplementation(() => ({
        from: fromMock,
        where: whereMock,
      }));

      // Expect followProfile to throw HttpException with NOT_FOUND status
      await expect(service.followProfile(1, 'nonexistent')).rejects.toThrow(
        new HttpException('Profile does not exist', HttpStatus.NOT_FOUND),
      );
    });
  });

  describe('unfollowProfile', () => {
    const mockUser = {
      id: 2,
      email: 'john@example.com',
      username: 'john',
      bio: 'John bio',
      image: 'john-image.jpg',
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should unfollow a profile when currently following', async () => {
      // Mock user exists
      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockUser]);

      // Mock follow check returns non-empty array (currently following)
      const selectFollowMock = jest.fn().mockReturnThis();
      const fromFollowMock = jest.fn().mockReturnThis();
      const whereFollowMock = jest.fn().mockResolvedValue([{ id: 1 }]);

      // Mock delete follow
      const deleteMock = jest.fn().mockReturnThis();
      const deleteWhereMock = jest.fn().mockResolvedValue(undefined);

      // Setup the mock chain
      mockDrizzleService.db.select
        .mockImplementationOnce(() => ({
          from: fromUserMock,
          where: whereUserMock,
        }))
        .mockImplementationOnce(() => ({
          from: fromFollowMock,
          where: whereFollowMock,
        }));

      mockDrizzleService.db.delete.mockImplementation(() => ({
        where: deleteWhereMock,
      }));

      // Call unfollowProfile
      const currentUserId = 1;
      const result = await service.unfollowProfile(currentUserId, 'john');

      // Assert the profile data is correct with following set to false
      expect(result).toEqual({
        profile: {
          email: mockUser.email,
          bio: mockUser.bio,
          image: mockUser.image,
          following: false,
        },
      });

      // Verify delete was called
      expect(mockDrizzleService.db.delete).toHaveBeenCalled();
    });

    it('should not delete follow when not currently following', async () => {
      // Mock user exists
      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockUser]);

      // Mock follow check returns empty array (not currently following)
      const selectFollowMock = jest.fn().mockReturnThis();
      const fromFollowMock = jest.fn().mockReturnThis();
      const whereFollowMock = jest.fn().mockResolvedValue([]);

      // Setup the mock chain
      mockDrizzleService.db.select
        .mockImplementationOnce(() => ({
          from: fromUserMock,
          where: whereUserMock,
        }))
        .mockImplementationOnce(() => ({
          from: fromFollowMock,
          where: whereFollowMock,
        }));

      // Call unfollowProfile
      const currentUserId = 1;
      const result = await service.unfollowProfile(currentUserId, 'john');

      // Assert the profile data is correct with following set to false
      expect(result).toEqual({
        profile: {
          email: mockUser.email,
          bio: mockUser.bio,
          image: mockUser.image,
          following: false,
        },
      });

      // Verify delete was not called
      expect(mockDrizzleService.db.delete).not.toHaveBeenCalled();
    });

    it('should throw HttpException when trying to unfollow yourself', async () => {
      // Mock user exists with same ID as current user
      const mockSelfUser = {
        ...mockUser,
        id: 1, // Same as currentUserId
      };

      const selectUserMock = jest.fn().mockReturnThis();
      const fromUserMock = jest.fn().mockReturnThis();
      const whereUserMock = jest.fn().mockResolvedValue([mockSelfUser]);

      mockDrizzleService.db.select.mockImplementation(() => ({
        from: fromUserMock,
        where: whereUserMock,
      }));

      // Expect unfollowProfile to throw HttpException with BAD_REQUEST status
      await expect(service.unfollowProfile(1, 'john')).rejects.toThrow(
        new HttpException(
          'You cannot unfollow yourself',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw HttpException when profile does not exist', async () => {
      // Mock user does not exist
      const selectMock = jest.fn().mockReturnThis();
      const fromMock = jest.fn().mockReturnThis();
      const whereMock = jest.fn().mockResolvedValue([]);

      mockDrizzleService.db.select.mockImplementation(() => ({
        from: fromMock,
        where: whereMock,
      }));

      // Expect unfollowProfile to throw HttpException with NOT_FOUND status
      await expect(service.unfollowProfile(1, 'nonexistent')).rejects.toThrow(
        new HttpException('Profile does not exist', HttpStatus.NOT_FOUND),
      );
    });
  });
});
