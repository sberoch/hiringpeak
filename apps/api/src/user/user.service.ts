import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  excludePassword,
  hashPassword,
  User,
  users,
} from '@workspace/shared/schemas';
import { and, asc, count, desc, eq, ilike, not, SQL } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import type { UserPublic } from '@workspace/shared/types/user';
import {
  CreateUserDto,
  UpdateUserDto,
  UserFindAllServiceParams,
} from './user.dto';

@Injectable()
export class UserService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: UserFindAllServiceParams,
  ): Promise<PaginatedResponse<Omit<User, 'password'>>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.users.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(users.id) })
      .from(users)
      .where(whereClause);

    let [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    const itemsResponse = items.map((user) => excludePassword(user as User));
    return paginatedResponse(itemsResponse, totalItems, paginationQuery);
  }

  /** Find user by id only (e.g. for JWT validation). */
  async findById(id: number): Promise<UserPublic | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) return null;
    return excludePassword(user) as UserPublic;
  }

  async findOne(id: number, organizationId: number) {
    let user = await this.db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.organizationId, organizationId)),
    });
    if (!user) throw new NotFoundException('Not found');
    user = excludePassword(user);
    return user;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) throw new NotFoundException('Not found');
    return user;
  }

  async create(
    createUserDto: CreateUserDto,
    organizationId: number,
    options?: DbOptions,
  ) {
    createUserDto.password = await hashPassword(createUserDto.password);
    const values = { ...createUserDto, organizationId };
    const db = options?.tx ?? this.db;
    let [user] = await db.insert(users).values(values).returning();
    user = excludePassword(user);
    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    organizationId: number,
  ) {
    if (updateUserDto.password && updateUserDto.password !== '') {
      updateUserDto.password = await hashPassword(updateUserDto.password);
    }
    if (updateUserDto.password === '') {
      delete updateUserDto.password;
    }
    let [user] = await this.db
      .update(users)
      .set(updateUserDto)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .returning();
    if (!user) throw new NotFoundException('Not found');
    user = excludePassword(user);
    return user;
  }

  async remove(id: number, organizationId: number) {
    let [user] = await this.db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .returning();
    if (!user) throw new NotFoundException('Not found');
    user = excludePassword(user);
    return user;
  }

  async updateLastLogin(id: number) {
    const updatedData: Partial<User> = {
      lastLogin: new Date(),
    };
    await this.db.update(users).set(updatedData).where(eq(users.id, id));
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: UserFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = users[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: UserFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(users.organizationId, params.organizationId));
    if (params.email) {
      filters.push(ilike(users.email, `%${params.email}%`));
    }
    if (params.name) {
      filters.push(ilike(users.name, `%${params.name}%`));
    }
    if (params.active !== undefined) {
      filters.push(eq(users.active, params.active));
    }
    if (params.roleId != null) {
      filters.push(eq(users.roleId, params.roleId));
    }
    if (params.excludeRoleId != null) {
      filters.push(not(eq(users.roleId, params.excludeRoleId)));
    }
    return and(...filters);
  }
}
