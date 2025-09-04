import { ApiProperty } from '@nestjs/swagger';
import {
  PaginationParams as PaginationParamsType,
  PaginatedResponse as PaginatedResponseType,
} from '@workspace/shared/types/pagination';

export class PaginationParams implements PaginationParamsType {
  @ApiProperty({ required: false, example: 1 })
  page?: number;

  @ApiProperty({ required: false, example: 10 })
  limit?: number;

  @ApiProperty({ required: false, example: 'id:asc' })
  order?: string;
}

export interface PaginatedResponse<T> extends PaginatedResponseType<T> {
  items: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}
