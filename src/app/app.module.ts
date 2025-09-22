import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AppConfigModule } from 'src/configuration/app-configuration.module';
import { DatabaseModule } from 'src/database/database.module';
import { PostsModule } from 'src/posts/posts.module';
import { PaginationModule } from 'src/pagination/pagination.module';

import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    DatabaseModule,
    AppConfigModule,
    PaginationModule,
    UserModule,
    PostsModule,
    AuthModule,
  ],
})
export class AppModule {}
