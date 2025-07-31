import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { DrizzleService } from '../database/drizzle.service';

// Mock DrizzleService
const mockDrizzleService = {
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
};

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createComment', () => {
    it('should create a comment successfully', async () => {
      const authorId = 1;
      const slug = 'test-article';
      const createCommentDto = { body: 'This is a comment' };

      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ id: 1 }]),
      });
      mockDrizzleService.db.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockResolvedValueOnce([
            { id: 1, body: 'This is a comment', authorId, articleId: 1 },
          ]),
      });

      const result = await service.createComment(
        authorId,
        slug,
        createCommentDto,
      );
      expect(result).toEqual({
        comment: {
          id: 1,
          body: 'This is a comment',
          authorId,
          articleId: 1,
        },
      });
    });

    it('should throw an error if the article does not exist', async () => {
      const authorId = 1;
      const slug = 'non-existent-article';
      const createCommentDto = { body: 'This is a comment' };

      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(
        service.createComment(authorId, slug, createCommentDto),
      ).rejects.toThrow('Article not found');
    });
  });

  describe('getComments', () => {
    it('should return comments for an article', async () => {
      const slug = 'test-article';
      const userId = 1;

      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ id: 1 }]),
      });
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([
          {
            comments: {
              id: 1,
              body: 'This is a comment',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            author: {
              id: 1,
              username: 'testuser',
              email: 'testuser@example.com',
            },
          },
          {
            comments: {
              id: 2,
              body: 'This is a second comment',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            author: {
              id: 1,
              username: 'anhnn',
              email: 'anhnn@example.com',
            },
          },
        ]),
      });

      const result = await service.getComments(userId, slug);
      expect(result).toEqual({
        comments: [
          {
            id: 1,
            body: 'This is a comment',
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            author: {
              id: 1,
              username: 'testuser',
              email: 'testuser@example.com',
            },
          },
          {
            id: 2,
            body: 'This is a second comment',
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            author: {
              id: 1,
              username: 'anhnn',
              email: 'anhnn@example.com',
            },
          },
        ],
      });
    });
  });
});
