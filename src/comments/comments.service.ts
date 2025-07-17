import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/database/drizzle.service';
import { articles } from 'src/database/entities/article.entity';
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

  generateCommentResponse(comment: Comment): CommentResponse {
    return {
      comment,
    };
  }
}
