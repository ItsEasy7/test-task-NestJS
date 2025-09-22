import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from './entity/token.entity';
import { CreateUserDto, LoginDto, UpdateUserDto } from '../auth/dto/auth.dto';
import { PaginatedResponse } from 'src/pagination/dto/paginated-response.dto';
import { PaginationService } from 'src/pagination/pagination.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    public readonly userRepository: Repository<User>,
    private readonly paginationService: PaginationService,
    private readonly jwtService: JwtService,
  ) {}

  async getOne(
    userId: number,
  ): Promise<Pick<User, 'fio' | 'login' | 'id' | 'isActive'>> {
    const user = await this.userRepository.findOne({
      select: ['fio', 'login', 'id', 'isActive'],
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Такого пользователя не существует');
    return user;
  }

  async findByLogin(login: string): Promise<User | undefined> {
    return (
      (await this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.login) = LOWER(:login)', { login })
        .getOne()) ?? undefined
    );
  }

  async getAll(page: number, limit: number): Promise<PaginatedResponse<User>> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    return this.paginationService.paginate(queryBuilder, page, limit);
  }

  async deactivateUser(userId: number): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ isActive: false })
      .where('id = :id', { id: userId })
      .execute();

    await this.userRepository.manager.delete(RefreshToken, {
      user: { id: userId },
    });
  }

  async activateUser(userId: number): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ isActive: true })
      .where('id = :id', { id: userId })
      .execute();
  }

  async updateUser(
    userId: number,
    dto: UpdateUserDto,
  ): Promise<Pick<User, 'fio' | 'login'>> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ ...dto })
      .where('id = :id', { id: userId })
      .execute();

    return this.getOne(userId);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exist = await this.findByLogin(dto.login);
    if (exist)
      throw new ConflictException(
        'Пользователь с таким логином уже существует',
      );

    const hash = await bcrypt.hash(dto.password, 10);

    const result = await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({ login: dto.login, password: hash, fio: dto.fio })
      .returning('login')
      .execute();

    return result.raw[0] as User;
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Старый пароль неверный');

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ password: newHash })
      .where('id = :id', { id: userId })
      .execute();
  }
}
