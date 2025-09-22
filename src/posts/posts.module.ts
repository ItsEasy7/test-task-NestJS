import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Posts } from './entity/posts.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PaginationModule } from 'src/pagination/pagination.module';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/user/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Posts, User]),
    PaginationModule,
    JwtModule.register({}),
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
