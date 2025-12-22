import { createZodDto } from 'nestjs-zod';
import { PaginationParamsSchema } from '@workspace/shared/dtos';
import { PaginatedResponse as PaginatedResponseType } from '@workspace/shared/types/pagination';

export class PaginationParams extends createZodDto(PaginationParamsSchema) {}

export interface PaginatedResponse<T> extends PaginatedResponseType<T> {
  items: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
