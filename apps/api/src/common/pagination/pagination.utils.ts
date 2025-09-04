import { BadRequestException } from '@nestjs/common';
import { PgSelect } from 'drizzle-orm/pg-core';
import { PaginationParams } from './pagination.params';

export const getOrder = (orderStr: string) => {
  if (orderStr.split(':').length !== 2)
    throw new BadRequestException('Bad order string');
  const [key, direction] = orderStr.split(':');
  return { key, direction };
};

export interface PaginationQuery {
  page: number;
  limit: number;
  offset: number;
  order: Record<string, string>;
}

export const buildPaginationQuery = (
  params: PaginationParams,
): PaginationQuery => {
  const page = params.page ? parseInt(params.page.toString()) : 1;
  const limit = params.limit ? parseInt(params.limit.toString()) : 100;
  const offset = (page - 1) * limit;

  const order = getOrder(params.order ? params.order : 'id:asc');

  return { page, limit, offset, order };
};

export const withPagination = <T extends PgSelect>(
  qb: T,
  query: PaginationQuery,
) => {
  return qb.limit(query.limit).offset(query.offset);
};

export const paginatedResponse = <T>(
  items: T[],
  totalItems: number,
  query: PaginationQuery,
) => {
  return {
    items,
    meta: {
      totalItems,
      currentPage: query.page,
      totalPages: Math.ceil(totalItems / query.limit),
      pageSize: query.limit,
    },
  };
};
