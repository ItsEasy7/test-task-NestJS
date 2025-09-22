import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './token.entity';
import { Transform } from 'class-transformer';
import { Posts } from 'src/posts/entity/posts.entity';

@Entity({ name: 'user' })
@Index('idx_user_id', ['id'])
@Index('idx_user_login', ['login'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'example@example.com',
    description: 'Логин пользователя',
  })
  @Column({ name: 'login', type: 'varchar', length: 255 })
  login: string;

  @Column({ name: 'password', type: 'varchar', length: 255 })
  password: string;

  @Column({ name: 'fio', type: 'varchar', length: 255 })
  fio: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: true,
  })
  refreshTokens: RefreshToken[];

  @OneToMany(() => Posts, (posts) => posts.user)
  posts: Posts[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
