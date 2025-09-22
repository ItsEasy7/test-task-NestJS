import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

interface PaginatedResponse<T> {
  message: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
  data: T[];
}

interface StandardResponse<T> {
  message: string;
  data: T;
}

@Injectable()
export class StandardResponseInterceptor<T>
  implements NestInterceptor<T, PaginatedResponse<T> | StandardResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const message =
      this.reflector.get<string>('responseMessage', context.getHandler()) ||
      'Успешное выполнение запроса';

    return next.handle().pipe(
      map((data) => {
        if (!data) return;
        if ('total' in data && 'totalPages' in data) {
          return {
            message: data.message || message,
            page: data.page || 1,
            limit: data.limit || 10,
            total: data.total || 0,
            totalPages: data.totalPages || 1,
            nextPage: data.nextPage || null,
            prevPage: data.prevPage || null,
            data: data.data || [],
          };
        }

        return {
          message: data.message || message,
          data: data.data || data,
        };
      }),
    );
  }
}
