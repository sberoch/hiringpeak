import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateRoleDto,
  RoleQueryParamsDto,
  UpdateRoleDto,
} from '@workspace/shared/dtos';
import { PermissionCode } from '@workspace/shared/enums';
import { rolePermissions, roles } from '@workspace/shared/schemas';
import { and, asc, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import { PermissionService } from '../permission/permission.service';

export type RoleFindAllServiceParams = RoleQueryParamsDto & {
  organizationId: number;
};

const ALL_PERMISSION_CODES = Object.values(PermissionCode);
const READ_ONLY_CODES = [
  PermissionCode.CANDIDATE_READ,
  PermissionCode.VACANCY_READ,
  PermissionCode.USER_READ,
  PermissionCode.COMPANY_READ,
  PermissionCode.AREA_READ,
  PermissionCode.SETTINGS_READ,
];
const MANAGER_CODES = ALL_PERMISSION_CODES.filter(
  (c) => c !== PermissionCode.ROLE_MANAGE,
);

@Injectable()
export class RoleService {
  constructor(
    @Inject(DrizzleProvider) private readonly db: DrizzleDatabase,
    private readonly permissionService: PermissionService,
  ) {}

  async findAll(params: RoleFindAllServiceParams) {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.roles.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(roles.id) })
      .from(roles)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number, organizationId: number) {
    const row = await this.db.query.roles.findFirst({
      where: and(eq(roles.id, id), eq(roles.organizationId, organizationId)),
    });
    if (!row) throw new NotFoundException('Not found');
    const permRows = await this.db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, id));
    return {
      ...row,
      permissionIds: permRows.map((p) => p.permissionId),
    };
  }

  async create(dto: CreateRoleDto, organizationId: number) {
    const [role] = await this.db
      .insert(roles)
      .values({
        name: dto.name,
        organizationId: organizationId,
      } as typeof roles.$inferInsert)
      .returning();
    if (!role) throw new BadRequestException('Failed to create role');

    if (dto.permissionIds?.length) {
      await this.db.insert(rolePermissions).values(
        dto.permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      );
    }

    return this.findOne(role.id, organizationId);
  }

  async update(id: number, dto: UpdateRoleDto, organizationId: number) {
    await this.findOne(id, organizationId);

    if (dto.name !== undefined) {
      await this.db
        .update(roles)
        .set({ name: dto.name } as Partial<typeof roles.$inferInsert>)
        .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));
    }

    if (dto.permissionIds !== undefined) {
      await this.db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, id));
      if (dto.permissionIds.length > 0) {
        await this.db.insert(rolePermissions).values(
          dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        );
      }
    }

    return this.findOne(id, organizationId);
  }

  async remove(id: number, organizationId: number) {
    const [deleted] = await this.db
      .delete(roles)
      .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)))
      .returning();
    if (!deleted) throw new NotFoundException('Not found');
    return deleted;
  }

  /**
   * Seeds permissions (idempotent) and creates default roles for an organization.
   * Returns the three role IDs for assignment (e.g. to initial admin user).
   */
  async createDefaultRolesForOrganization(
    organizationId: number,
    options?: DbOptions,
  ): Promise<{
    administradorRoleId: number;
    managerRoleId: number;
    basicRoleId: number;
  }> {
    const db = options?.tx ?? this.db;
    const permissionIdsByCode = await this.permissionService.seedPermissions(options);
    const getIds = (codes: string[]) =>
      codes
        .map((c) => permissionIdsByCode.get(c))
        .filter((id): id is number => id != null);

    const [adminRole] = await db
      .insert(roles)
      .values({ name: 'Administrador', organizationId } as typeof roles.$inferInsert)
      .returning({ id: roles.id });
    if (!adminRole) throw new Error('Failed to create Administrador role');
    await db.insert(rolePermissions).values(
      getIds(ALL_PERMISSION_CODES).map((permissionId) => ({
        roleId: adminRole.id,
        permissionId,
      })),
    );

    const [managerRole] = await db
      .insert(roles)
      .values({ name: 'Manager', organizationId } as typeof roles.$inferInsert)
      .returning({ id: roles.id });
    if (!managerRole) throw new Error('Failed to create Manager role');
    await db.insert(rolePermissions).values(
      getIds(MANAGER_CODES).map((permissionId) => ({
        roleId: managerRole.id,
        permissionId,
      })),
    );

    const [basicRole] = await db
      .insert(roles)
      .values({ name: 'Basic', organizationId } as typeof roles.$inferInsert)
      .returning({ id: roles.id });
    if (!basicRole) throw new Error('Failed to create Basic role');
    await db.insert(rolePermissions).values(
      getIds(READ_ONLY_CODES).map((permissionId) => ({
        roleId: basicRole.id,
        permissionId,
      })),
    );

    return {
      administradorRoleId: adminRole.id,
      managerRoleId: managerRole.id,
      basicRoleId: basicRole.id,
    };
  }

  private buildOrderBy(params: RoleQueryParamsDto): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    const validColumns = [
      'id',
      'organizationId',
      'name',
      'isSystem',
      'createdAt',
      'updatedAt',
    ] as const;
    if (!validColumns.includes(sortBy as (typeof validColumns)[number])) {
      throw new BadRequestException('Invalid sortBy parameter');
    }
    const column = roles[sortBy as (typeof validColumns)[number]];
    return [sortOrder(column)];
  }

  private buildWhereClause(params: RoleFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(roles.organizationId, params.organizationId));
    if (params.name) {
      filters.push(ilike(roles.name, `%${params.name}%`));
    }
    return and(...filters);
  }
}
