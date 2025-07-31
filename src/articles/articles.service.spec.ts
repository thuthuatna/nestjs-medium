import { PostgresErrorCode } from './../database/postgres-error-code.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleService } from '../database/drizzle.service';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dtos/create-article.dto';
import { GetArticlesDto } from './dtos/get-articles.dto';

const mockDrizzleService = {
  db: {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
};

const mockUsers = {
  id: 1,
  username: 'testuser',
  bio: 'Test bio',
  image: 'test-image.jpg',
};

const mockArticles = {
  id: 1,
  slug: 'test-article',
  title: 'Test Article',
  description: 'Test description',
  tagList: ['test', 'article'],
  createdAt: new Date(),
  updatedAt: new Date(),
  authorId: 1,
};

const mockArticleResults = [
  {
    slug: 'test-article',
    title: 'Test Article',
    description: 'Test description',
    tagList: ['test', 'article'],
    createdAt: new Date(),
    updatedAt: new Date(),
    favorited: false,
    favoritesCount: 2,
    author: {
      username: 'testuser',
      bio: 'Test bio',
      image: 'test-image.jpg',
      following: false,
    },
  },
];

const mockCountResult = [{ count: 1 }];

describe('ArticlesService', () => {
  let service: ArticlesService;
  let drizzleService: DrizzleService;

  // Mock query builder chain
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  // Mock query builder for count
  const mockCountQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    drizzleService = module.get<DrizzleService>(DrizzleService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getArticles', () => {
    it('should return articles and count without filters', async () => {
      mockDrizzleService.db.select.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.execute.mockResolvedValueOnce(mockArticleResults);

      mockDrizzleService.db.select.mockReturnValueOnce(mockCountQueryBuilder); // for count
      mockCountQueryBuilder.execute.mockResolvedValueOnce(mockCountResult);

      const result = await service.getArticles({} as GetArticlesDto);

      expect(result.articles).toEqual(mockArticleResults);
      expect(result.articlesCount).toBe(1);
      expect(mockDrizzleService.db.select).toHaveBeenCalledTimes(2);
    });

    it('should return articles with filter tag', async () => {
      const filterDto = { tag: 'test' } as GetArticlesDto;

      mockDrizzleService.db.select.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.execute.mockResolvedValueOnce(mockArticleResults);

      mockDrizzleService.db.select.mockReturnValueOnce(mockCountQueryBuilder); // for count
      mockCountQueryBuilder.execute.mockResolvedValueOnce(mockCountResult);

      const result = await service.getArticles(filterDto);

      expect(result.articles).toEqual(mockArticleResults);
      expect(result.articlesCount).toBe(1);
      expect(mockDrizzleService.db.select).toHaveBeenCalledTimes(2);
    });

    it('should return articles with filter author', async () => {
      const filterDto = { author: 'testuser' } as GetArticlesDto;

      // Mock the author lookup query
      const mockAuthorQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce([{ id: 1 }]),
      };
      mockDrizzleService.db.select
        .mockReturnValueOnce(mockAuthorQueryBuilder) // for author lookup
        .mockReturnValueOnce(mockQueryBuilder); // for articles query

      mockQueryBuilder.execute.mockResolvedValueOnce(mockArticleResults);

      mockDrizzleService.db.select.mockReturnValueOnce(mockCountQueryBuilder); // for count
      mockCountQueryBuilder.execute.mockResolvedValueOnce(mockCountResult);

      const result = await service.getArticles(filterDto);

      expect(result.articles).toEqual(mockArticleResults);
      expect(result.articlesCount).toBe(1);
      expect(mockDrizzleService.db.select).toHaveBeenCalledTimes(3);
    });

    it('should return articles with filter favorited', async () => {
      const filterDto = { favorited: 'testuser' } as GetArticlesDto;

      mockDrizzleService.db.select.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.execute.mockResolvedValueOnce(mockArticleResults);

      mockDrizzleService.db.select.mockReturnValueOnce(mockCountQueryBuilder); // for count
      mockCountQueryBuilder.execute.mockResolvedValueOnce(mockCountResult);

      const result = await service.getArticles(filterDto);

      expect(result.articles).toEqual(mockArticleResults);
      expect(result.articlesCount).toBe(1);
      expect(mockDrizzleService.db.select).toHaveBeenCalledTimes(2);
    });

    it('should return empty articles when author does not exist', async () => {
      const filterDto = { author: 'nonexistentuser' } as GetArticlesDto;

      const mockAuthorQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce([]), // No author found
      };
      mockDrizzleService.db.select
        .mockReturnValueOnce(mockAuthorQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.execute.mockResolvedValueOnce([]);

      mockDrizzleService.db.select.mockReturnValueOnce(mockCountQueryBuilder);
      mockCountQueryBuilder.execute.mockResolvedValueOnce([{ count: 0 }]);

      const result = await service.getArticles(filterDto);

      expect(result.articles).toEqual([]);
      expect(result.articlesCount).toBe(0);
      expect(mockDrizzleService.db.select).toHaveBeenCalledTimes(3);
    });

    it('should throw error when DB query fails', async () => {
      const filterDto = {} as GetArticlesDto;

      mockDrizzleService.db.select.mockReturnValueOnce(mockQueryBuilder);
      mockQueryBuilder.execute.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.getArticles(filterDto)).rejects.toThrow(
        'Failed to fetch articles',
      );
    });
  });

  describe('createArticle', () => {
    it('should create a new article successfully', async () => {
      const userId = 1;
      const createArticleDto: CreateArticleDto = {
        title: 'Unique Article',
        description: 'Description',
        body: 'Body',
        tagList: ['tag1', 'tag2'],
      };

      // Mock slug check (no article with this slug)
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      });

      // Mock insert
      const mockInsertedArticle = [{ id: 123 }];
      mockDrizzleService.db.insert.mockReturnValueOnce({
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce(mockInsertedArticle),
      });

      // Mock select for article result
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([
          {
            id: 123,
            slug: 'unique-article',
            title: 'Unique Article',
            description: 'Description',
            body: 'Body',
            tagList: ['tag1', 'tag2'],
            createdAt: new Date(),
            updatedAt: new Date(),
            favoritesCount: 0,
            author: {
              username: 'testuser',
              bio: 'Test bio',
              image: 'test-image.jpg',
            },
          },
        ]),
      });

      const result = await service.createArticle(userId, createArticleDto);

      expect(result.article.slug).toBe('unique-article');
      expect(result.article.title).toBe('Unique Article');
      expect(result.article.description).toBe('Description');
      expect(result.article.body).toBe('Body');
      expect(result.article.tagList).toEqual(['tag1', 'tag2']);
      expect(result.article.author.username).toBe('testuser');
      expect(result.article.author.bio).toBe('Test bio');
      expect(result.article.author.image).toBe('test-image.jpg');
      expect(result.article.favoritesCount).toBe(0);
      expect(result.article.createdAt).toBeInstanceOf(Date);
      expect(result.article.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw conflict if article slug already exists', async () => {
      const userId = 1;
      const createArticleDto: CreateArticleDto = {
        title: 'Duplicate Article',
        description: 'Description',
        body: 'Body',
        tagList: ['tag1'],
      };

      // Mock slug check (article with this slug exists)
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([{ id: 1 }]),
      });

      await expect(
        service.createArticle(userId, createArticleDto),
      ).rejects.toThrow('Article with this slug already exists');
    });
  });

  describe('getFeed', () => {
    it('should return empty articles and count if user follows no one', async () => {
      const currentUserId = 1;
      const paginationDto = { limit: 10, offset: 0 };

      // Mock followResults as empty
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      });

      const result = await service.getFeed(currentUserId, paginationDto);

      expect(result).toEqual({ articles: [], articlesCount: 0 });
    });

    it('should return articles feed for followed users', async () => {
      const currentUserId = 1;
      const paginationDto = { limit: 10, offset: 0 };
      const followResults = [{ followingId: 2 }, { followingId: 3 }];

      // Mock followResults
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce(followResults),
      });

      // Mock articleCountQuery and articlesQuery
      const mockArticleCountResult = [{ count: 2 }];
      const mockArticlesResults = [
        {
          article: {
            id: 10,
            slug: 'article-1',
            title: 'Article 1',
            description: 'Desc 1',
            tagList: ['tag'],
            createdAt: new Date(),
            updatedAt: new Date(),
            favoritesCount: 5,
          },
          user: {
            username: 'author1',
            bio: 'bio1',
            image: 'img1.jpg',
          },
        },
        {
          article: {
            id: 11,
            slug: 'article-2',
            title: 'Article 2',
            description: 'Desc 2',
            tagList: ['tag2'],
            createdAt: new Date(),
            updatedAt: new Date(),
            favoritesCount: 3,
          },
          user: {
            username: 'author2',
            bio: 'bio2',
            image: 'img2.jpg',
          },
        },
      ];

      // Mock Promise.all for articleCountQuery and articlesQuery
      const mockArticleCountQuery = Promise.resolve(mockArticleCountResult);
      const mockArticlesQuery = Promise.resolve(mockArticlesResults);

      // Mock the db calls for articleCountQuery and articlesQuery
      mockDrizzleService.db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        }) // for articleCountQuery
        .mockReturnValueOnce({
          from: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockReturnThis(),
        }); // for articlesQuery

      // Patch Promise.all to resolve our mocks
      jest
        .spyOn(Promise, 'all')
        .mockResolvedValueOnce([mockArticleCountResult, mockArticlesResults]);

      // Mock getUserFavorites
      jest.spyOn(service as any, 'getUserFavorites').mockResolvedValue([10]);

      const result = await service.getFeed(currentUserId, paginationDto);

      expect(result.articles.length).toBe(2);
      expect(result.articles[0].favorited).toBe(true);
      expect(result.articles[1].favorited).toBe(false);
      expect(result.articlesCount).toBe(2);

      // Restore Promise.all
      (Promise.all as jest.Mock).mockRestore();
    });
  });

  describe('updateArticle', () => {
    const slug = 'test-article';
    const currentUserId = 1;
    const updateArticleDto = {
      title: 'Updated Title',
      description: 'Updated Description',
      body: 'Updated Body',
    };

    const mockArticle = {
      id: 1,
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'Test body',
      tagList: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      favoritesCount: 0,
      authorId: currentUserId,
    };

    it('should update the article successfully', async () => {
      // Mock findBySlug
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      // Mock slug check (no conflict)
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      });

      // Mock update chain: update().set().where().returning()
      const mockUpdatedArticle = [{ id: 1 }];
      const mockReturning = jest.fn().mockResolvedValueOnce(mockUpdatedArticle);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      mockDrizzleService.db.update.mockReturnValue({ set: mockSet });

      // Mock select for article result
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([
          {
            article: {
              id: 1,
              slug: 'updated-title',
              title: 'Updated Title',
              description: 'Updated Description',
              body: 'Updated Body',
              tagList: ['test'],
              createdAt: new Date(),
              updatedAt: new Date(),
              favoritesCount: 0,
            },
            author: {
              username: 'testuser',
              bio: 'Test bio',
              image: 'test-image.jpg',
            },
          },
        ]),
      });

      const result = await service.updateArticle(
        slug,
        currentUserId,
        updateArticleDto,
      );

      expect(result.article.slug).toBe('updated-title');
      expect(result.article.title).toBe('Updated Title');
      expect(result.article.description).toBe('Updated Description');
      expect(result.article.body).toBe('Updated Body');
      expect(result.article.author.username).toBe('testuser');
      expect(result.article.author.following).toBe(false);
    });

    it('should throw forbidden if user is not the author', async () => {
      jest
        .spyOn(service, 'findBySlug')
        .mockResolvedValueOnce({ ...mockArticle, authorId: 999 });

      await expect(
        service.updateArticle(slug, currentUserId, updateArticleDto),
      ).rejects.toThrow('You are not authorized to update this article');
    });

    it('should throw conflict if new slug already exists', async () => {
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      // Mock slug check (conflict)
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([{ id: 2 }]),
      });

      await expect(
        service.updateArticle(slug, currentUserId, updateArticleDto),
      ).rejects.toThrow('Article with this slug already exists');
    });
  });

  describe('findBySlug', () => {
    const slug = 'test-article';
    const mockArticle = {
      id: 1,
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'Test body',
      tagList: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      favoritesCount: 0,
      authorId: 1,
    };

    it('should return the article if found', async () => {
      // Mock select().from().where() chain to resolve to an array with the article
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockArticle]),
      });

      // Patch pop to return the article (simulate .pop() on array)
      const result = await service.findBySlug(slug);
      expect(result).toEqual(mockArticle);
    });

    it('should throw NOT_FOUND if article does not exist', async () => {
      mockDrizzleService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      });

      await expect(service.findBySlug(slug)).rejects.toThrow(
        'Article not found',
      );
    });
  });

  describe('deleteArticle', () => {
    const slug = 'test-article';
    const currentUserId = 1;
    const mockArticle = {
      id: 1,
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'Test body',
      tagList: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      favoritesCount: 0,
      authorId: currentUserId,
    };

    it('should delete the article if user is the author', async () => {
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      const mockWhere = jest.fn().mockResolvedValueOnce(undefined);
      mockDrizzleService.db.delete.mockReturnValue({ where: mockWhere });

      await expect(
        service.deleteArticle(slug, currentUserId),
      ).resolves.toBeUndefined();
      expect(service.findBySlug).toHaveBeenCalledWith(slug);
      expect(mockDrizzleService.db.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should throw forbidden if user is not the author', async () => {
      jest
        .spyOn(service, 'findBySlug')
        .mockResolvedValueOnce({ ...mockArticle, authorId: 999 });

      await expect(service.deleteArticle(slug, currentUserId)).rejects.toThrow(
        'You are not authorized to delete this article',
      );
    });
  });

  describe('favoriteArticle', () => {
    const userId = 1;
    const slug = 'test-article';
    const mockArticle = {
      id: 1,
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'Test body',
      tagList: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      favoritesCount: 2,
      authorId: 1,
    };

    it('should favorite the article successfully', async () => {
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      const mockReturning = jest.fn().mockResolvedValueOnce([{ id: 1 }]);
      const mockValues = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      mockDrizzleService.db.insert.mockReturnValue({ values: mockValues });

      const result = await service.favoriteArticle(userId, slug);

      expect(service.findBySlug).toHaveBeenCalledWith(slug);
      expect(mockDrizzleService.db.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        userId,
        articleId: mockArticle.id,
      });
      expect(result.article.favorited).toBe(true);
      expect(result.article.favoritesCount).toBe(3);
    });

    it('should throw INTERNAL_SERVER_ERROR if insert returns empty', async () => {
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      const mockReturning = jest.fn().mockResolvedValueOnce([]);
      const mockValues = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      mockDrizzleService.db.insert.mockReturnValue({ values: mockValues });

      await expect(service.favoriteArticle(userId, slug)).rejects.toThrow(
        'Failed to favorite article',
      );
    });

    it('should throw CONFLICT if article already favorited', async () => {
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      const error = {
        cause: { code: PostgresErrorCode.UniqueViolation },
      };
      const mockReturning = jest.fn().mockRejectedValueOnce(error);
      const mockValues = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      mockDrizzleService.db.insert.mockReturnValue({ values: mockValues });

      jest.spyOn(service['logger'], 'error').mockImplementation(() => {});

      await expect(service.favoriteArticle(userId, slug)).rejects.toThrow(
        'Article already favorited',
      );
    });
  });

  describe('unfavoriteArticle', () => {
    const userId = 1;
    const slug = 'test-article';
    const mockArticle = {
      id: 1,
      slug: 'test-article',
      title: 'Test Article',
      description: 'Test description',
      body: 'Test body',
      tagList: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      favoritesCount: 2,
      authorId: 1,
    };

    it('should unfavorite the article successfully', async () => {
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      const mockReturning = jest.fn().mockResolvedValueOnce([{ id: 1 }]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDrizzleService.db.delete.mockReturnValue({ where: mockWhere });

      const result = await service.unfavoriteArticle(userId, slug);

      expect(service.findBySlug).toHaveBeenCalledWith(slug);
      expect(mockDrizzleService.db.delete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result.article.favorited).toBe(false);
      expect(result.article.favoritesCount).toBe(1);
    });

    it('should throw INTERNAL_SERVER_ERROR if delete returns empty', async () => {
      jest.spyOn(service, 'findBySlug').mockResolvedValueOnce(mockArticle);

      const mockReturning = jest.fn().mockResolvedValueOnce([]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      mockDrizzleService.db.delete.mockReturnValue({ where: mockWhere });

      await expect(service.unfavoriteArticle(userId, slug)).rejects.toThrow(
        'Failed to unfavorite article',
      );
    });
  });
});
