import { PartialType } from '@nestjs/swagger';
import { CreatePostsDto } from './create-posts.dto';

export class UpdatePostsDto extends PartialType(CreatePostsDto) {}
