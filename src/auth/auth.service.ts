import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from 'src/user/user.service';
import {
  LoginDto,
  VerifyDto,
  ChangePasswordDto,
  RegisterDto,
  ResendCodeDto,
} from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from 'src/user/entity/token.entity';
import { RedisService } from './redis.service';
import { LoginLog } from './entity/login.entity';
import * as bcrypt from 'bcrypt';
import { MailService } from './mail.service';
import { MailType } from 'src/core/consts';

@Injectable()
export class AuthService {
  private readonly codeTTL: number = Number(process.env.CODE_TTL_IN_MINUTES);
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(LoginLog)
    private readonly loginLogRepository: Repository<LoginLog>,
  ) {}

  async login(
    dto: LoginDto,
  ): Promise<{ message: string; retryAfter?: number }> {
    const user = await this.userService.findByLogin(dto.login);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Неверные учетные данные');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Неверный пароль');
    const code = Math.floor(100000 + Math.random() * 900000);
    const redisKey = `auth:code:${user.id}`;
    const ttl = await this.redisService.ttl(redisKey);
    if (ttl > 0) {
      return {
        message: `Подождите ${ttl} секунд до повторной отправки кода`,
        retryAfter: ttl,
      };
    }
    await this.redisService.set(redisKey, code, this.codeTTL * 60);
    await this.mailService.sendMail(user.login, MailType.VERIFICATION_CODE, {
      code,
    });
    return { message: 'Код отправлен на почту' };
  }

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; retryAfter?: number }> {
    const existingUser = await this.userService.findByLogin(dto.login);
    if (existingUser) {
      throw new ForbiddenException(
        'Пользователь с таким логином уже существует',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const insertResult = await this.userService.userRepository
      .createQueryBuilder()
      .insert()
      .into('user')
      .values({
        login: dto.login,
        password: hashedPassword,
        fio: dto.fio,
        isActive: true,
        createdAt: new Date(),
      })
      .returning('*')
      .execute();

    const user = insertResult.raw[0];
    const code = Math.floor(100000 + Math.random() * 900000);
    const redisKey = `auth:code:${user.id}`;
    const ttl = await this.redisService.ttl(redisKey);
    if (ttl > 0) {
      return {
        message: `Подождите ${ttl} секунд до повторной отправки кода`,
        retryAfter: ttl,
      };
    }
    await this.redisService.set(redisKey, code, this.codeTTL * 60);
    await this.mailService.sendMail(user.login, MailType.REGISTRATION_CODE, {
      code,
    });
    return { message: 'Пользователь зарегистрирован. Код отправлен на почту' };
  }

  async verify(
    dto: VerifyDto,
    ip: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.findByLogin(dto.login);
    if (!user) throw new UnauthorizedException('Пользователь не найден');

    const codeKey = `auth:code:${user.id}`;
    const attemptsKey = `auth:attempts:${user.id}`;

    const currentAttemptsRaw = await this.redisService.get(attemptsKey);
    const currentAttempts = +(currentAttemptsRaw ?? 0);

    if (currentAttempts >= 5) {
      const attemptsTtl = await this.redisService.ttl(attemptsKey);

      if (attemptsTtl > 0) {
        throw new ForbiddenException(
          `Превышено количество попыток. Повторите через ${attemptsTtl} сек.`,
        );
      }
    }

    const storedCode = await this.redisService.get(codeKey);
    if (!storedCode || storedCode !== dto.code) {
      const nextAttempts = currentAttempts + 1;

      if (nextAttempts >= 5) {
        await this.redisService.set(attemptsKey, nextAttempts, 600);
        await this.loginLogRepository.save({
          user,
          ip,
          userAgent,
          createdAt: new Date(),
          success: false,
        });

        throw new ForbiddenException(
          'Превышено количество попыток. Повторите через 10 минут.',
        );
      } else {
        await this.redisService.set(attemptsKey, nextAttempts, 0);
      }

      throw new ForbiddenException('Неверный или истекший код');
    }

    await this.redisService.delete(codeKey);
    await this.redisService.delete(attemptsKey);

    const accessToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ),
      },
    );

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
      },
    );

    await this.refreshTokenRepository.save({
      token: refreshToken,
      user,
      createdAt: new Date(),
    });

    await this.loginLogRepository.save({
      user,
      ip,
      userAgent,
      createdAt: new Date(),
      success: true,
    });

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token: refreshToken });
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Refresh токен недействителен');
    }
    const tokenInDb = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });
    await this.validateUser(payload.userId);
    if (!tokenInDb) throw new ForbiddenException('Refresh токен не найден');
    const user = tokenInDb.user;
    const accessToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ),
      },
    );
    return { accessToken };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.userService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
    return { message: 'Пароль успешно изменен' };
  }

  async validateUser(userId: number): Promise<boolean> {
    const user = await this.userService.getOne(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Неверные учетные данные');
    }
    return true;
  }

  async sendRecoveryCode(
    email: string,
  ): Promise<{ message: string; retryAfter?: number }> {
    if (!email) {
      throw new UnauthorizedException('Email не указан');
    }
    const user = await this.userService.findByLogin(email);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    const code = Math.floor(100000 + Math.random() * 900000);
    const redisKey = `restore:code:${user.id}`;
    const ttl = await this.redisService.ttl(redisKey);
    if (ttl > 0) {
      return {
        message: `Подождите ${ttl} секунд до повторной отправки кода`,
        retryAfter: ttl,
      };
    }
    await this.redisService.set(redisKey, code, this.codeTTL * 60);
    await this.mailService.sendMail(user.login, MailType.RECOVERY_CODE, {
      code,
    });
    return { message: 'Код отправлен на почту' };
  }

  async forgotPassword(
    email: string,
    code: string,
  ): Promise<{ message: string }> {
    if (!email) {
      throw new UnauthorizedException('Email не указан');
    }
    const user = await this.userService.findByLogin(email);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const redisKey = `restore:code:${user.id}`;
    const attemptsKey = `restore:attempts:${user.id}`;

    const currentAttemptsRaw = await this.redisService.get(attemptsKey);
    const currentAttempts = +(currentAttemptsRaw ?? 0);

    if (currentAttempts >= 5) {
      const attemptsTtl = await this.redisService.ttl(attemptsKey);

      if (attemptsTtl > 0) {
        throw new ForbiddenException(
          `Превышено количество попыток. Повторите через ${attemptsTtl} сек.`,
        );
      }
    }

    const storedCode = await this.redisService.get(redisKey);
    if (!storedCode || storedCode !== code) {
      const nextAttempts = currentAttempts + 1;

      if (nextAttempts >= 5) {
        await this.redisService.set(attemptsKey, nextAttempts, 600);

        throw new ForbiddenException(
          'Превышено количество попыток. Повторите через 10 минут.',
        );
      } else {
        await this.redisService.set(attemptsKey, nextAttempts, 0);
      }

      throw new ForbiddenException('Неверный или истекший код');
    }

    await this.redisService.delete(attemptsKey);
    await this.redisService.delete(redisKey);

    const newPassword =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-2);
    const hash = await bcrypt.hash(newPassword, 10);

    await this.userService.userRepository
      .createQueryBuilder()
      .update()
      .set({ password: hash })
      .where('id = :id', { id: user.id })
      .execute();

    await this.mailService.sendMail(user.login, MailType.NEW_PASSWORD, {
      password: newPassword,
    });

    await this.redisService.delete(redisKey);

    return { message: 'Новый пароль отправлен на почту' };
  }

  async resendCode(
    dto: ResendCodeDto,
  ): Promise<{ message: string; retryAfter?: number }> {
    const user = await this.userService.findByLogin(dto.login);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    let redisKey: string;

    switch (dto.codeType) {
      case MailType.VERIFICATION_CODE:
      case MailType.REGISTRATION_CODE:
        redisKey = `auth:code:${user.id}`;
        break;
      case MailType.RECOVERY_CODE:
        redisKey = `restore:code:${user.id}`;
        break;
      default:
        throw new UnauthorizedException('Неподдерживаемый тип кода');
    }

    const ttl = await this.redisService.ttl(redisKey);
    if (ttl > 0) {
      return {
        message: `Подождите ${ttl} секунд до повторной отправки кода`,
        retryAfter: ttl,
      };
    }

    await this.redisService.set(redisKey, code, this.codeTTL * 60);
    await this.mailService.sendMail(user.login, dto.codeType, { code });
    return { message: 'Код отправлен на почту' };
  }
}
