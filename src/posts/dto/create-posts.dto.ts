import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsISO8601,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostsDto {
  @ApiProperty({ description: 'Заголовок поста', example: 'Пост дня' })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;

  @ApiProperty({
    description: 'Текст поста',
    example: 'Содержание поста...',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  content: string;

  @ApiProperty({
    description: 'URL изображения',
    example: 'https://example.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: 'Дата поста',
    type: Date,
  })
  @IsISO8601()
  postDate: Date;
}
