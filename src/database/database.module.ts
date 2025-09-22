import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from 'src/user/entity/user.entity';
import { RefreshToken } from 'src/user/entity/token.entity';
import { LoginLog } from 'src/auth/entity/login.entity';
import { Posts } from 'src/posts/entity/posts.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'test_task'),
        autoLoadEntities: true,
        synchronize: false,
        entities: [User, Posts, RefreshToken, LoginLog],
        // migrations: ['migrations/*.ts'],
      }),
    }),
  ],
})
export class DatabaseModule {}
