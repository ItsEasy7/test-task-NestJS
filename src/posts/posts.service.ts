import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Posts } from './entity/posts.entity';
import { CreatePostsDto } from './dto/create-posts.dto';
import { UpdatePostsDto } from './dto/update-posts.dto';
import { PaginationService } from 'src/pagination/pagination.service';
import { PaginatedResponse } from 'src/pagination/dto/paginated-response.dto';
import { User } from 'src/user/entity/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Posts)
    private readonly postsRepository: Repository<Posts>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createPostsDto: CreatePostsDto, userId: number): Promise<Posts> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const insertResult = await this.postsRepository
      .createQueryBuilder()
      .insert()
      .into(Posts)
      .values({ ...createPostsDto, userId: user.id })
      .returning('*')
      .execute();

    return insertResult.raw[0] as Posts;
  }

  async findAll(
    page: number,
    limit: number,
    user: any,
  ): Promise<PaginatedResponse<Posts>> {
    const queryBuilder = this.postsRepository.createQueryBuilder('posts');
    if (!user) {
      queryBuilder.where('posts.hidden = false');
    }
    return await this.paginationService.paginate(queryBuilder, page, limit);
  }

  async findOne(id: number): Promise<Posts> {
    const posts = await this.postsRepository.findOne({ where: { id } });
    if (!posts) throw new NotFoundException('Пост не найден');
    return posts;
  }

  async hidePost(id: number, userId: number): Promise<void> {
    const isComplete = await this.postsRepository
      .createQueryBuilder()
      .update(Posts)
      .set({ hidden: true })
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .execute();
    if (!isComplete.affected) {
      throw new NotFoundException('Пост не найден');
    }
  }

  async showPost(id: number, userId: number): Promise<void> {
    const isComplete = await this.postsRepository
      .createQueryBuilder()
      .update(Posts)
      .set({ hidden: false })
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .execute();
    if (!isComplete.affected) {
      throw new NotFoundException('Пост не найден');
    }
  }

  async update(
    id: number,
    dto: UpdatePostsDto,
    userId: number,
  ): Promise<Posts> {
    const isUpdated = await this.postsRepository
      .createQueryBuilder()
      .update(Posts)
      .set({ ...dto })
      .where('id = :id', { id })
      .andWhere('user_id = :userId', { userId })
      .execute();

    if (!isUpdated.affected) {
      throw new NotFoundException('Пост не найден');
    }
    return this.findOne(id);
  }
}
