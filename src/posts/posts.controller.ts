import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostsDto } from './dto/create-posts.dto';
import { UpdatePostsDto } from './dto/update-posts.dto';
import { Posts } from './entity/posts.entity';
import { PaginatedResponse } from 'src/pagination/dto/paginated-response.dto';
import { SetResponseMessage } from 'src/core/decorator/message.decorator';
import { JwtService } from '@nestjs/jwt';
import { Auth } from 'src/core/decorator/auth.decorator';
import { AuthRequest } from 'src/auth/auth.interface';
import { Public } from 'src/core/consts';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  @Auth()
  @SetResponseMessage('Пост создан')
  @ApiOperation({ summary: 'Создать пост' })
  @ApiResponse({ status: 201, description: 'Пост создан', type: Posts })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async create(
    @Body() createPostsDto: CreatePostsDto,
    @Req() { user }: AuthRequest,
  ): Promise<Posts> {
    return this.postsService.create(createPostsDto, user.userId);
  }

  @Get()
  @Public()
  @SetResponseMessage('Список постов')
  @ApiOperation({
    summary:
      'Получить список постов с пагинацией (авторизованный — все, неавторизованный — только не скрытые)',
  })
  @ApiResponse({
    status: 200,
    description: 'Список постов',
    type: PaginatedResponse,
  })
  @ApiResponse({ status: 422, description: 'Некорректные параметры пагинации' })
  @ApiBearerAuth()
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Req() { user }: AuthRequest,
  ): Promise<PaginatedResponse<Posts>> {
    return this.postsService.findAll(page, limit, user);
  }

  @Get(':id')
  @Public()
  @SetResponseMessage('Данные поста')
  @ApiOperation({ summary: 'Получить пост по ID' })
  @ApiResponse({ status: 200, description: 'Данные поста', type: Posts })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Posts> {
    return this.postsService.findOne(id);
  }

  @Put(':id')
  @Auth()
  @SetResponseMessage('Пост обновлен')
  @ApiOperation({ summary: 'Обновить пост' })
  @ApiResponse({ status: 200, description: 'Пост обновлен', type: Posts })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostsDto: UpdatePostsDto,
    @Req() { user }: AuthRequest,
  ): Promise<Posts> {
    return this.postsService.update(id, updatePostsDto, user.userId);
  }

  @Patch('hide/:id')
  @Auth()
  @SetResponseMessage('Пост скрыт')
  @ApiOperation({ summary: 'Скрыть пост' })
  @ApiResponse({ status: 200, description: 'Пост скрыт' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  async hidePosts(
    @Param('id', ParseIntPipe) id: number,
    @Req() { user }: AuthRequest,
  ): Promise<void> {
    return this.postsService.hidePost(id, user.userId);
  }

  @Patch('show/:id')
  @Auth()
  @SetResponseMessage('Пост показывается')
  @ApiOperation({ summary: 'Показать пост' })
  @ApiResponse({ status: 200, description: 'Пост показывается' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 400, description: 'Некорректный ID поста' })
  async showPosts(
    @Param('id', ParseIntPipe) id: number,
    @Req() { user }: AuthRequest,
  ): Promise<void> {
    return this.postsService.showPost(id, user.userId);
  }
}
