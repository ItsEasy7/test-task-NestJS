import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { SetResponseMessage } from 'src/core/decorator/message.decorator';
import { Auth } from 'src/core/decorator/auth.decorator';
import { AuthRequest } from 'src/auth/auth.interface';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @Auth()
  @SetResponseMessage('Данные пользователя')
  @ApiOperation({ summary: 'Получить данные текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Данные пользователя', type: User })
  async getMe(
    @Req() { user }: AuthRequest,
  ): Promise<Pick<User, 'fio' | 'login'>> {
    const userData = await this.userService.getOne(user.userId);
    return { fio: userData.fio, login: userData.login };
  }

  @Get('get')
  @Auth()
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Номер страницы (по умолчанию 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество элементов на странице (по умолчанию 10)',
  })
  @SetResponseMessage('Список пользователей')
  @ApiOperation({ summary: 'Получить список пользователей с пагинацией' })
  @ApiResponse({
    status: 200,
    description:
      'Список пользователей. Желательно обложить ролевой, но это выведено чисто для тестов',
    type: [User],
  })
  async getAll(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Req() { user }: AuthRequest,
  ): Promise<any> {
    return this.userService.getAll(page, limit);
  }
}
