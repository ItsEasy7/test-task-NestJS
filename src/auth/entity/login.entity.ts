import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/user/entity/user.entity';

@Entity()
export class LoginLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', comment: 'ID пользователя, добавившего пост' })
  userId: number;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'success', type: 'boolean', default: true })
  success: boolean;
}
