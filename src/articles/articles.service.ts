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
import { schema } from '../database/schema';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);
  constructor(private readonly drizzleService: DrizzleService) {}

  /**
   * Get articles based on filters and pagination.
   * @param getArticlesDto The DTO containing filter and pagination options.
   * @param currentUserId The ID of the current user (optional).
   * @returns A promise that resolves to the articles and their count.
   */
  async getArticles(getArticlesDto: GetArticlesDto, currentUserId?: number) {
    try {
      const { limit = 20, offset = 0, tag, author, favorited } = getArticlesDto;

      // Combine filters using AND
      const conditions: SQL<unknown>[] = [];
      if (tag) {
        if (tag && typeof tag === 'string' && tag.trim() !== '') {
          conditions.push(sql`${tag} = ANY(${articles.tagList})`);
        }
      }
      if (author) {
        const authorResults = await this.drizzleService.db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, author));

        if (authorResults.length) {
          conditions.push(eq(articles.authorId, authorResults[0].id));
        }
      }
      if (favorited) {
        conditions.push(
          sql`EXISTS (
          SELECT 1
          FROM ${schema.userFavoriteArticles}
          JOIN ${schema.users} ON ${schema.users.id} = ${schema.userFavoriteArticles.userId}
          WHERE ${schema.userFavoriteArticles.articleId} = ${schema.articles.id}
          AND ${schema.users.username} = ${favorited}
        )`,
        );
      }

      // base query to get articles
      const query = this.drizzleService.db
        .select({
          slug: schema.articles.slug,
          title: schema.articles.title,
          description: schema.articles.description,
          tagList: schema.articles.tagList,
          createdAt: schema.articles.createdAt,
          updatedAt: schema.articles.updatedAt,
          favorited: favorited
            ? sql<boolean>`EXISTS (
            SELECT 1
            FROM ${schema.userFavoriteArticles}
            JOIN ${schema.users} ON ${schema.users.id} = ${schema.userFavoriteArticles.userId}
            WHERE ${schema.userFavoriteArticles.articleId} = ${schema.articles.id}
            AND ${schema.users.username} = ${sql.placeholder('favorited')}
          )`.as('favorited')
            : sql<boolean>`FALSE`.as('favorited'),
          favoritesCount: sql<number>`COUNT(${userFavoriteArticles.userId})`.as(
            'favoritesCount',
          ),
          author: {
            username: schema.users.username,
            bio: schema.users.bio,
            image: schema.users.image,
            following: sql<boolean>`EXISTS (
            SELECT 1
            FROM ${schema.follows}
            WHERE ${schema.follows.followerId} = ${currentUserId}
            AND ${schema.follows.followingId} = ${schema.articles.authorId}
          )`.as('following'),
          },
        })
        .from(schema.articles)
        .leftJoin(schema.users, eq(schema.articles.authorId, schema.users.id))
        .leftJoin(
          schema.userFavoriteArticles,
          eq(schema.userFavoriteArticles.articleId, schema.articles.id),
        )
        .where(and(...conditions))
        .groupBy(articles.id, users.id);

      // query count of articles
      const countQuery = this.drizzleService.db
        .select({ count: count(schema.articles.id) })
        .from(schema.articles)
        .leftJoin(schema.users, eq(schema.articles.authorId, schema.users.id))
        .where(and(...conditions));

      const [articleCountResult, articlesResults] = await Promise.all([
        countQuery.execute(),
        query.limit(limit).offset(offset).execute(),
      ]);

      return {
        articles: articlesResults,
        articlesCount: articleCountResult[0].count,
      };
    } catch (error) {
      this.logger.error('Error fetching articles', error);
      throw new HttpException(
        'Failed to fetch articles',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get the list of article IDs favorited by a user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of article IDs.
   */
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
