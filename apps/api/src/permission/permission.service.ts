import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  PermissionQueryParamsDto,
  UpdatePermissionDto,
} from '@workspace/shared/dtos';
import { PermissionCode } from '@workspace/shared/enums';
import { permissions } from '@workspace/shared/schemas';
import { and, asc, count, desc, eq, ilike, inArray, SQL } from 'drizzle-orm';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';

const PERMISSION_SEED: { code: string; label: string; description: string }[] = [
  { code: PermissionCode.CANDIDATE_READ, label: 'Ver postulantes', description: 'Permite ver listado y detalle de postulantes' },
  { code: PermissionCode.CANDIDATE_MANAGE, label: 'Gestionar postulantes', description: 'Crear, editar y eliminar postulantes' },
  { code: PermissionCode.VACANCY_READ, label: 'Ver vacantes', description: 'Permite ver listado y detalle de vacantes' },
  { code: PermissionCode.VACANCY_MANAGE, label: 'Gestionar vacantes', description: 'Crear, editar y eliminar vacantes' },
  { code: PermissionCode.USER_READ, label: 'Ver usuarios', description: 'Ver usuarios de la organización' },
  { code: PermissionCode.USER_MANAGE, label: 'Gestionar usuarios', description: 'Crear y editar usuarios' },
  { code: PermissionCode.ROLE_MANAGE, label: 'Gestionar roles', description: 'Crear y asignar roles y permisos' },
  { code: PermissionCode.COMPANY_READ, label: 'Ver empresas', description: 'Ver empresas' },
  { code: PermissionCode.COMPANY_MANAGE, label: 'Gestionar empresas', description: 'Crear y editar empresas' },
  { code: PermissionCode.AREA_READ, label: 'Ver áreas', description: 'Ver áreas' },
  { code: PermissionCode.AREA_MANAGE, label: 'Gestionar áreas', description: 'Crear y editar áreas' },
  { code: PermissionCode.SETTINGS_READ, label: 'Ver configuración', description: 'Ver configuración de la organización' },
  { code: PermissionCode.SETTINGS_MANAGE, label: 'Gestionar configuración', description: 'Modificar configuración' },
];

@Injectable()
export class PermissionService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(params: PermissionQueryParamsDto) {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.permissions.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });

    const countQuery = this.db
      .select({ count: count(permissions.id) })
      .from(permissions)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    return paginatedResponse(items, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const row = await this.db.query.permissions.findFirst({
      where: eq(permissions.id, id),
    });
    if (!row) throw new NotFoundException('Not found');
    return row;
  }

  /** Returns permission codes for the given permission IDs (order not guaranteed). */
  async getCodesByIds(ids: number[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select({ code: permissions.code })
      .from(permissions)
      .where(inArray(permissions.id, ids));
    return rows.map((r) => r.code);
  }

  /**
   * Idempotent seed of global permissions. Returns map of code -> id for use by role seeding.
   */
  async seedPermissions(options?: DbOptions): Promise<Map<string, number>> {
    const db = options?.tx ?? this.db;
    const codeToId = new Map<string, number>();
    for (const { code, label, description } of PERMISSION_SEED) {
      const existing = await db.query.permissions.findFirst({
        where: eq(permissions.code, code),
        columns: { id: true },
      });
      if (existing) {
        codeToId.set(code, existing.id);
        continue;
      }
      const [row] = await db
        .insert(permissions)
        .values({ code, label, description } as typeof permissions.$inferInsert)
        .returning({ id: permissions.id });
      if (row) codeToId.set(code, row.id);
    }
    return codeToId;
  }

  async update(id: number, dto: UpdatePermissionDto) {
    const set: Record<string, unknown> = {};
    if (dto.label != null) set.label = dto.label;
    if (dto.description !== undefined) set.description = dto.description;
    const [updated] = await this.db
      .update(permissions)
      .set(set as typeof permissions.$inferInsert)
      .where(eq(permissions.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Not found');
    return updated;
  }

  private buildOrderBy(params: PermissionQueryParamsDto): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    const validColumns = [
      'id',
      'code',
      'label',
      'description',
      'createdAt',
      'updatedAt',
    ] as const;
    if (!validColumns.includes(sortBy as (typeof validColumns)[number])) {
      throw new BadRequestException('Invalid sortBy parameter');
    }
    const column = permissions[sortBy as (typeof validColumns)[number]];
    return [sortOrder(column)];
  }

  private buildWhereClause(params: PermissionQueryParamsDto) {
    const filters: SQL[] = [];
    if (params.code) {
      filters.push(ilike(permissions.code, `%${params.code}%`));
    }
    if (params.label) {
      filters.push(ilike(permissions.label, `%${params.label}%`));
    }
    return filters.length > 0 ? and(...filters) : undefined;
  }
}
