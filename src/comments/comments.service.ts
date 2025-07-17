import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { articles } from '../database/entities/article.entity';
import { users } from '../database/entities/user.entity';
import { Comment, comments } from './../database/entities/comment.entity';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { CommentResponse } from './types/comment-response.interface';

@Injectable()
export class CommentsService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async createComment(
    authorId: number,
    slug: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponse> {
    const articleResults = await this.drizzleService.db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!articleResults.length) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const comment = await this.drizzleService.db
      .insert(comments)
      .values({
        body: createCommentDto.body,
        authorId,
        articleId: articleResults[0].id,
      })
      .returning();

    return this.generateCommentResponse(comment[0]);
  }

  async getComments(userId: number | undefined, slug: string) {
    const articleResults = await this.drizzleService.db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (!articleResults.length) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const commentsResults = await this.drizzleService.db
      .select({
        comments: comments,
        author: users,
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.articleId, articleResults[0].id));

    const commentsWithAuthor = commentsResults.map((result) => ({
      id: result.comments.id,
      body: result.comments.body,
      createdAt: result.comments.createdAt,
      updatedAt: result.comments.updatedAt,
      author: result.author,
    }));
    return {
      comments: commentsWithAuthor,
    };
  }

  generateCommentResponse(comment: Comment): CommentResponse {
    return {
      comment,
    };
  }
}
