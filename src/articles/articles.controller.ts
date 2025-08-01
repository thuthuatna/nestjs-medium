import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from '../comments/comments.service';
import { CreateCommentDto } from '../comments/dtos/create-comment.dto';
import { CurrentUser } from '../common/decorators/user.decorator';
import { PaginationDto } from '../common/dto';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dtos/create-article.dto';
import { GetArticlesDto } from './dtos/get-articles.dto';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createArticle(
    @CurrentUser('userId') userId: number,
    @Body('article') createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.createArticle(userId, createArticleDto);
  }

  @Post(':slug/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @CurrentUser('userId') userId: number,
    @Param('slug') slug: string,
    @Body('comment') createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(userId, slug, createCommentDto);
  }

  @Post(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  favoriteArticle(
    @CurrentUser('userId') userId: number,
    @Param('slug') slug: string,
  ) {
    return this.articlesService.favoriteArticle(userId, slug);
  }

  @Delete(':slug/favorite')
  @UseGuards(JwtAuthGuard)
  unfavoriteArticle(
    @CurrentUser('userId') userId: number,
    @Param('slug') slug: string,
  ) {
    return this.articlesService.unfavoriteArticle(userId, slug);
  }

  @Get()
  getArticles(
    @CurrentUser('userId') userId: number,
    @Query() getArticlesDto: GetArticlesDto,
  ) {
    return this.articlesService.getArticles(getArticlesDto, userId);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(
    @CurrentUser('userId') userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.articlesService.getFeed(userId, paginationDto);
  }

  @Get(':slug/comments')
  getComments(
    @CurrentUser('userId') userId: number | undefined,
    @Param('slug') slug: string,
  ) {
    return this.commentsService.getComments(userId, slug);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard)
  updateArticle(
    @Param('slug') slug: string,
    @CurrentUser('userId') userId: number,
    @Body('article') updateArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.updateArticle(slug, userId, updateArticleDto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArticle(
    @Param('slug') slug: string,
    @CurrentUser('userId') userId: number,
  ): Promise<void> {
    await this.articlesService.deleteArticle(slug, userId);
  }
}
