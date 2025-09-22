import {
  Body,
  Controller,
  Post,
  Patch,
  Request,
  UnauthorizedException,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  VerifyDto,
  ChangePasswordDto,
  RestorepasswordDto,
  ForgotPasswordDto,
  RegisterDto,
  ResendCodeDto,
} from './dto/auth.dto';
import { SetResponseMessage } from 'src/core/decorator/message.decorator';
import { Auth } from 'src/core/decorator/auth.decorator';
import { AuthRequest } from './auth.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @SetResponseMessage('Код отправлен на почту')
  @ApiOperation({ summary: 'Авторизация: отправка кода на почту' })
  @ApiResponse({ status: 200, description: 'Код отправлен на почту' })
  @ApiResponse({
    status: 401,
    description: 'Неверные учетные данные или неверный пароль',
  })
  @ApiResponse({ status: 403, description: 'Слишком много попыток входа' })
  @ApiResponse({ status: 429, description: 'Превышен лимит запросов' })
  async login(@Body() dto: LoginDto, @Res() res: Response): Promise<any> {
    const result = await this.authService.login(dto);
    if (result.retryAfter) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({ message: result.message });
    }
    return res.json({ message: result.message });
  }

  @Post('register')
  @SetResponseMessage('Пользователь зарегистрирован. Код отправлен на почту')
  @ApiOperation({
    summary: 'Регистрация пользователя с отправкой кода на почту',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь зарегистрирован. Код отправлен на почту',
  })
  @ApiResponse({
    status: 403,
    description: 'Слишком много попыток регистрации',
  })
  @ApiResponse({ status: 409, description: 'Пользователь уже существует' })
  @ApiResponse({ status: 429, description: 'Превышен лимит запросов' })
  async register(@Body() dto: RegisterDto, @Res() res: Response): Promise<any> {
    const result = await this.authService.register(dto);
    if (result.retryAfter) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({ message: result.message });
    }
    return res.status(201).json({ message: result.message });
  }

  @Post('verify')
  @SetResponseMessage('Токены выданы')
  @ApiOperation({ summary: 'Проверка кода и выдача токенов' })
  @ApiResponse({
    status: 200,
    description: 'Токены выданы',
    schema: {
      example: {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Пользователь не найден' })
  @ApiResponse({
    status: 403,
    description: 'Неверный или истекший код, слишком много попыток',
  })
  async verify(
    @Body() dto: VerifyDto,
    @Request() req,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.verify(dto, ip, userAgent);
  }

  @Post('logout')
  @SetResponseMessage('Пользователь вышел из системы')
  @ApiOperation({ summary: 'Выход из системы' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: '',
          description: 'Refresh токен',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({ status: 200, description: 'Пользователь вышел из системы' })
  @ApiResponse({
    status: 403,
    description: 'Refresh токен недействителен или не найден',
  })
  async logout(@Body('refreshToken') refreshToken: string): Promise<void> {
    return this.authService.logout(refreshToken);
  }

  @Post('refresh')
  @SetResponseMessage('Access токен обновлен')
  @ApiOperation({ summary: 'Обновление access токена' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: '',
          description: 'Refresh токен',
        },
      },
      required: ['refreshToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Access токен обновлен',
    schema: { example: { accessToken: 'new_access_token' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Refresh токен недействителен или не найден',
  })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string }> {
    return this.authService.refresh(refreshToken);
  }

  @Patch('change-password')
  @Auth()
  @SetResponseMessage('Пароль успешно изменен')
  @ApiOperation({ summary: 'Смена пароля' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован или неверные учетные данные',
  })
  async changePassword(
    @Req() { user }: AuthRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user.userId, dto);
  }

  @Post('forgot-password')
  @SetResponseMessage('Пароль отправлен на почту')
  @ApiOperation({ summary: 'Восстановление пароля' })
  @ApiResponse({ status: 200, description: 'Пароль отправлен на почту' })
  @ApiResponse({
    status: 401,
    description: 'Email не указан или пользователь не найден',
  })
  async forgotPassword(
    @Body() dto: RestorepasswordDto,
  ): Promise<{ message: string }> {
    if (!dto) {
      throw new UnauthorizedException('Email не указан');
    }
    return this.authService.forgotPassword(dto.login, dto.code);
  }

  @Post('send-recovery')
  @SetResponseMessage('Код отправлен на почту')
  @ApiOperation({ summary: 'Отправка кода для восстановления пароля' })
  @ApiResponse({ status: 200, description: 'Код отправлен на почту' })
  @ApiResponse({ status: 401, description: 'Email не указан' })
  @ApiResponse({ status: 429, description: 'Превышен лимит запросов' })
  async sendRecoveryCode(
    @Body() dto: ForgotPasswordDto,
    @Res() res: Response,
  ): Promise<any> {
    if (!dto.login) {
      throw new UnauthorizedException('Email не указан');
    }
    const result = await this.authService.sendRecoveryCode(dto.login);
    if (result.retryAfter) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({ message: result.message });
    }
    return res.json({ message: result.message });
  }

  @Post('resend-code')
  @SetResponseMessage('Код отправлен на почту')
  @ApiOperation({
    summary:
      'Повторная отправка кода (авторизация, регистрация, восстановление)',
  })
  @ApiResponse({ status: 200, description: 'Код отправлен на почту' })
  @ApiResponse({ status: 401, description: 'Email не указан' })
  @ApiResponse({ status: 429, description: 'Превышен лимит запросов' })
  async resendCode(
    @Body() dto: ResendCodeDto,
    @Res() res: Response,
  ): Promise<any> {
    const result = await this.authService.resendCode(dto);
    if (result.retryAfter) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({ message: result.message });
    }
    return res.json({ message: result.message });
  }
}
