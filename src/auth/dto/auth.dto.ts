import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MailType } from 'src/core/consts';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Логин (email)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  login: string;

  @ApiProperty({ example: '12345678', description: 'Пароль' })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Иванов Иван Иванович',
    description: 'ФИО пользователя',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  fio: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Логин (email)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  login: string;

  @ApiProperty({ example: '12345678', description: 'Пароль' })
  @MinLength(6)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: 'Старый пароль' })
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'newPassword123', description: 'Новый пароль' })
  @MinLength(6)
  newPassword: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Логин (email)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  login: string;

  @ApiProperty({ example: '12345678', description: 'Пароль' })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'Иванов Иван Иванович',
    description: 'ФИО пользователя',
  })
  @IsNotEmpty()
  fio: string;
}

export class UpdateUserDto {
  @ApiProperty({
    example: 'Иванов Иван Иванович',
    description: 'ФИО пользователя',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  fio?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Логин (email)',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  login?: string;
}

export class VerifyDto {
  @ApiProperty({ example: 'user@example.com', description: 'Логин (email)' })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  login: string;

  @ApiProperty({ example: '123456', description: 'Код подтверждения' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RestorepasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Логин (email)' })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  login: string;

  @ApiProperty({ example: '123456', description: 'Код подтверждения' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Логин (email)' })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  login: string;
}

export class ResendCodeDto {
  @ApiProperty({ example: 'user@example.com', description: 'Логин (email)' })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  login: string;

  @ApiProperty({
    example: MailType.VERIFICATION_CODE,
    description: 'Тип кода для повторной отправки',
    enum: MailType,
  })
  @IsEnum(MailType)
  codeType: MailType;
}
