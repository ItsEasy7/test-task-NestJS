import { Module } from '@nestjs/common';
import { PaginationService } from './pagination.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule],
  providers: [PaginationService],
  exports: [PaginationService],
})
export class PaginationModule {}
