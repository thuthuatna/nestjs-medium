import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { and, count, desc, eq, inArray, sql, SQL } from 'drizzle-orm';
import { PaginationDto } from '../common/dto';
import { DrizzleService } from '../database/drizzle.service';
import { articles } from '../database/entities/article.entity';
import { follows } from '../database/entities/follow.entity';
import { userFavoriteArticles } from '../database/entities/user-favorite-articles';
import { users } from '../database/entities/user.entity';
import { CreateArticleDto } from './dtos/create-article.dto';
import { GetArticlesDto } from './dtos/get-articles.dto';
import { UpdateArticleDto } from './dtos/update-article.dto';
import { ArticleResponse } from './types/article-response.interface';
import { isRecord } from '../utils/is-record';
import { PostgresErrorCode } from '../database/postgres-error-code.service';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);
  constructor(private readonly drizzleService: DrizzleService) {}

  async getArticles(getArticlesDto: GetArticlesDto, currentUserId?: number) {
    const { limit = 20, offset = 0, tag, author, favorited } = getArticlesDto;

    const conditions = await this.buildConditions({ tag, author, favorited });
    if (conditions === null) {
      return { articles: [], articlesCount: 0 };
    }

    // query to get total article count
    const articleCountQuery = this.drizzleService.db
      .select({ count: count(articles.id) })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(...(conditions || [])));

    // query to get articles with pagination and conditions
    const articlesQuery = this.drizzleService.db
      .select({
        user: { username: users.username, bio: users.bio, image: users.image },
        article: articles,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(articles.createdAt))
      .where(and(...(conditions || [])));

    const userFavoritesIds = currentUserId
      ? await this.getUserFavorites(currentUserId)
      : [];

    const [articleCountResult, articlesResults] = await Promise.all([
      articleCountQuery,
      articlesQuery,
    ]);

    // Map results
    const articlesWithFavorited = articlesResults.map((result) => ({
      slug: result.article.slug,
      title: result.article.title,
      description: result.article.description,
      tagList: result.article.tagList,
      createdAt: result.article.createdAt,
      updatedAt: result.article.updatedAt,
      favoritedCount: result.article.favoritesCount,
      favorited: userFavoritesIds.includes(result.article.id),
      author: result.user,
    }));

    return {
      articles: articlesWithFavorited,
      articlesCount: articleCountResult[0].count,
    };
  }

  private async buildConditions({
    tag,
    author,
    favorited,
  }: Partial<GetArticlesDto>): Promise<SQL<unknown>[] | null> {
    const conditions: SQL<unknown>[] = [];

    // filter by tag
    if (tag) {
      conditions.push(sql`${tag} = ANY(${articles.tagList})`);
    }

    // filter by author
    if (author) {
      const authorResults = await this.drizzleService.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, author));

      if (!authorResults.length) return null;
      conditions.push(eq(articles.authorId, authorResults[0].id));
    }

    // filter by favorited
    if (favorited) {
      const favoritedResults = await this.drizzleService.db
        .select({ articleId: userFavoriteArticles.articleId })
        .from(users)
        .innerJoin(
          userFavoriteArticles,
          eq(users.id, userFavoriteArticles.userId),
        )
        .where(eq(users.username, favorited));

      if (!favoritedResults.length) return null;
      const favoritesIds = favoritedResults.map((e) => e.articleId);
      conditions.push(inArray(articles.id, favoritesIds));
    }

    return conditions;
  }

  private async getUserFavorites(userId: number): Promise<number[]> {
    const favorites = await this.drizzleService.db
      .select({ articleId: userFavoriteArticles.articleId })
      .from(userFavoriteArticles)
      .where(eq(userFavoriteArticles.userId, userId));

    return favorites
      .map((f) => f.articleId)
      .filter((id): id is number => id !== null);
  }

  private createSlug(title: string): string {
    // Remove special characters, convert spaces to dashes, and ensure lowercase
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove all non-word chars (except spaces and dashes)
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-'); // Replace multiple dashes with single dash
  }

  async createArticle(userId: number, createArticleDto: CreateArticleDto) {
    const slug = this.createSlug(createArticleDto.title);
    const articleSlugResults = await this.drizzleService.db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug));
    if (articleSlugResults.length) {
      throw new HttpException(
        'Article with this slug already exists',
        HttpStatus.CONFLICT,
      );
    }
    const articleInsert = await this.drizzleService.db
      .insert(articles)
      .values({
        slug: this.createSlug(createArticleDto.title),
        title: createArticleDto.title,
        description: createArticleDto.description,
        body: createArticleDto.body,
        tagList: createArticleDto.tagList || [],
        authorId: userId,
      })
      .returning();

    const articleResult = await this.drizzleService.db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        description: articles.description,
        body: articles.body,
        tagList: articles.tagList,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        favoritesCount: articles.favoritesCount,
        author: {
          username: users.username,
          bio: users.bio,
          image: users.image,
        },
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.id, articleInsert[0].id));

    const articleData = articleResult[0];

    return {
      article: {
        slug: articleData.slug,
        title: articleData.title,
        description: articleData.description,
        body: articleData.body,
        tagList: articleData.tagList,
        createdAt: articleData.createdAt,
        updatedAt: articleData.updatedAt,
        favoritesCount: articleData.favoritesCount,
        author: {
          username: articleData.author?.username,
          bio: articleData.author?.bio,
          image: articleData.author?.image,
          following: false,
        },
      },
    };
  }

  async getFeed(currentUserId: number, paginationDto: PaginationDto) {
    const { limit = 20, offset = 0 } = paginationDto;
    const followResults = await this.drizzleService.db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, currentUserId));

    if (!followResults.length) {
      return { articles: [], articlesCount: 0 };
    }

    const articleCountQuery = this.drizzleService.db
      .select({ count: count(articles.id) })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(
        inArray(
          articles.authorId,
          followResults.map((f) => f.followingId),
        ),
      );

    const articlesQuery = this.drizzleService.db
      .select({
        user: { username: users.username, bio: users.bio, image: users.image },
        article: articles,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(
        inArray(
          articles.authorId,
          followResults.map((f) => f.followingId),
        ),
      )
      .limit(limit)
      .offset(offset);

    const [articleCountResult, articlesResults] = await Promise.all([
      articleCountQuery,
      articlesQuery,
    ]);

    const userFavoritesIds = currentUserId
      ? await this.getUserFavorites(currentUserId)
      : [];

    // Map results
    const articlesWithFavorited = articlesResults.map((result) => ({
      slug: result.article.slug,
      title: result.article.title,
      description: result.article.description,
      tagList: result.article.tagList,
      createdAt: result.article.createdAt,
      updatedAt: result.article.updatedAt,
      favoritedCount: result.article.favoritesCount,
      favorited: userFavoritesIds.includes(result.article.id),
      author: result.user,
    }));

    return {
      articles: articlesWithFavorited,
      articlesCount: articleCountResult[0].count,
    };
  }

  async updateArticle(
    slug: string,
    currentUserId: number,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponse> {
    const article = await this.findBySlug(slug);
    if (article.authorId !== currentUserId) {
      throw new HttpException(
        'You are not authorized to update this article',
        HttpStatus.FORBIDDEN,
      );
    }

    const newSlug = updateArticleDto.title
      ? this.createSlug(updateArticleDto.title)
      : article.slug;

    if (newSlug !== article.slug) {
      const existingWithSlug = await this.drizzleService.db
        .select({ id: articles.id })
        .from(articles)
        .where(eq(articles.slug, newSlug));

      if (existingWithSlug.length > 0) {
        throw new HttpException(
          'Article with this slug already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    // Update the article with all changes
    const updatedArticle = await this.drizzleService.db
      .update(articles)
      .set({
        slug: newSlug,
        title: updateArticleDto.title,
        description: updateArticleDto.description,
        body: updateArticleDto.body,
      })
      .where(eq(articles.id, article.id))
      .returning();

    const articleResult = await this.drizzleService.db
      .select({
        article: {
          id: articles.id,
          slug: articles.slug,
          title: articles.title,
          description: articles.description,
          body: articles.body,
          tagList: articles.tagList,
          createdAt: articles.createdAt,
          updatedAt: articles.updatedAt,
          favoritesCount: articles.favoritesCount,
        },
        author: {
          username: users.username,
          bio: users.bio,
          image: users.image,
        },
      })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.id, updatedArticle[0].id));
    return {
      article: {
        ...articleResult[0].article,
        author: { ...articleResult[0].author, following: false },
      },
    };
  }

  async findBySlug(slug: string) {
    const articleResults = await this.drizzleService.db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug));
    const article = articleResults.pop();
    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }
    return article;
  }

  async deleteArticle(slug: string, currentUserId: number): Promise<void> {
    const article = await this.findBySlug(slug);

    if (article.authorId !== currentUserId) {
      throw new HttpException(
        'You are not authorized to delete this article',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.drizzleService.db
      .delete(articles)
      .where(eq(articles.id, article.id));
  }

  async favoriteArticle(userId: number, slug: string) {
    const article = await this.findBySlug(slug);
    try {
      const userFavoriteArticle = await this.drizzleService.db
        .insert(userFavoriteArticles)
        .values({
          userId,
          articleId: article.id,
        })
        .returning();
      if (!userFavoriteArticle.length) {
        throw new HttpException(
          'Failed to favorite article',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      const code = error?.cause?.code;
      if (isRecord(error) && code === PostgresErrorCode.UniqueViolation) {
        this.logger.error('Article already favorited');
        throw new HttpException(
          'Article already favorited',
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }

    return {
      article: {
        ...article,
        favorited: true,
        favoritesCount: article.favoritesCount + 1,
      },
    };
  }

  async unfavoriteArticle(userId: number, slug: string) {
    const article = await this.findBySlug(slug);

    const deleteResult = await this.drizzleService.db
      .delete(userFavoriteArticles)
      .where(
        and(
          eq(userFavoriteArticles.userId, userId),
          eq(userFavoriteArticles.articleId, article.id),
        ),
      )
      .returning();

    if (!deleteResult.length) {
      throw new HttpException(
        'Failed to unfavorite article',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      article: {
        ...article,
        favorited: false,
        favoritesCount: article.favoritesCount - 1,
      },
    };
  }
}
