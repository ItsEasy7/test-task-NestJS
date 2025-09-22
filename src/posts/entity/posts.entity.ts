import {
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Entity,
  Column,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('posts')
@Index('idx_posts_id', ['id'])
@Index('idx_posts_created_at', ['createdAt'])
@Index('idx_posts_user_id', ['userId'])
export class Posts {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Заголовок поста', example: 'Пост дня' })
  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    description: 'Текст поста',
    example: 'Содержание поста...',
  })
  @Column({ name: 'content', type: 'text' })
  content: string;

  @ApiProperty({
    description: 'URL изображения',
    example: 'https://example.com/image.jpg',
  })
  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string;

  @ApiProperty({ description: 'Скрыт ли пост', example: false })
  @Column({ name: 'hidden', type: 'boolean', default: false })
  hidden: boolean;

  @ApiProperty({
    description: 'Дата поста',
    example: '2024-03-01T12:00:00.000Z',
  })
  @Column({ name: 'post_date' })
  postDate: Date;

  @Column({ name: 'user_id', comment: 'ID пользователя, добавившего пост' })
  userId: number;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
