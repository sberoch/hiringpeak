import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import {
  organizations,
  Organization,
  type NewOrganization,
  users,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DbOptions, DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CreateOrganizationDto,
  OrganizationQueryParams,
} from './organization.dto';
import {
  SORTABLE_ORGANIZATION_COLUMNS_MAP,
  type SortableOrganizationColumnKey,
} from './organization.types';

@Injectable()
export class OrganizationService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: OrganizationQueryParams,
  ): Promise<PaginatedResponse<Organization>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.organizations.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(organizations.id) })
      .from(organizations)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const org = await this.db.query.organizations.findFirst({
      where: eq(organizations.id, id),
    });
    if (!org) throw new NotFoundException('Not found');
    return org;
  }

  async findOneWithUsers(id: number) {
    const org = await this.findOne(id);
    const orgUsers = await this.db.query.users.findMany({
      where: eq(users.organizationId, id),
      columns: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        active: true,
        createdAt: true,
        lastLogin: true,
      },
    });
    return {
      ...org,
      users: orgUsers,
    };
  }

  async create(
    createOrganizationDto: CreateOrganizationDto,
    options?: DbOptions,
  ) {
    const db = options?.tx ?? this.db;
    const [org] = await db
      .insert(organizations)
      .values(createOrganizationDto as NewOrganization)
      .returning();
    return org;
  }

  private buildOrderBy(params: OrganizationQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    const column =
      SORTABLE_ORGANIZATION_COLUMNS_MAP[
        sortBy as SortableOrganizationColumnKey
      ];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: OrganizationQueryParams) {
    const filters: SQL[] = [];
    if (params.name) {
      filters.push(ilike(organizations.name, `%${params.name}%`));
    }
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
