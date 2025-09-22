import { BadRequestException, Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginatedResponse } from './dto/paginated-response.dto';

@Injectable()
export class PaginationService {
  async paginate<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<T>> {
    const offset = (page - 1) * limit;

    const totalCount = await queryBuilder.getCount();

    const totalPages = Math.ceil(totalCount / limit);

    if (page < 1 || (totalPages > 0 && page > totalPages)) {
      throw new BadRequestException(
        'Неверное значение страницы для объекта пагинации',
      );
    }

    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    const data = await queryBuilder.limit(limit).offset(offset).getMany();

    return {
      page,
      limit,
      total: totalCount,
      totalPages,
      nextPage,
      prevPage,
      data,
    };
  }
}
