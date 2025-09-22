import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class PaginatedResponse<T> {
  @ApiProperty({
    type: Number,
    description: 'Текущая страница',
    example: 2,
  })
  @IsNumber()
  page: number;
  @ApiProperty({
    type: Number,
    description: 'Количество элементов на странице',
    example: 10,
  })
  @IsNumber()
  limit: number;
  @ApiProperty({
    type: Number,
    description: 'Общее количество элементов',
    example: 100,
  })
  @IsNumber()
  total: number;
  @ApiProperty({
    type: Number,
    description: 'Общее количество страниц',
    example: 10,
  })
  @IsNumber()
  totalPages: number;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Номер следующей страницы (null, если последняя)',
    example: 3,
  })
  nextPage: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Номер предыдущей страницы (null, если первая)',
    example: 1,
  })
  prevPage: number | null;
  @ApiProperty({
    type: [Object],
    description: 'Массив данных текущей страницы',
  })
  @IsArray()
  data: T[];
}
