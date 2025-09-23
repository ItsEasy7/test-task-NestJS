import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './redis.service';
import { LoginLog } from './entity/login.entity';
import { MailService } from './mail.service';
@Module({
  imports: [
    UserModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([LoginLog]),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, MailService],
  exports: [AuthService],
})
export class AuthModule {}
