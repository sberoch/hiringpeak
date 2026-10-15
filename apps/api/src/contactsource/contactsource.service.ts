import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import {
  contacts,
  ContactSource,
  contactSources,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import {
  moveTo,
  persistPositions,
  without,
} from '../common/ordered-catalog/ordered-catalog';
import type {
  DbOptions,
  DrizzleDatabase,
} from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  ContactSourceFindAllServiceParams,
  CreateContactSourceServiceDto,
  UpdateContactSourceServiceDto,
} from './contactsource.dto';
import { DEFAULT_CONTACT_SOURCES } from '@workspace/shared/static/commercial-defaults';

@Injectable()
export class ContactSourceService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: ContactSourceFindAllServiceParams,
  ): Promise<PaginatedResponse<ContactSource & { contactCount: number }>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = eq(
      contactSources.organizationId,
      params.organizationId,
    );

    const itemsQuery = this.db.query.contactSources.findMany({
      where: whereClause,
      orderBy: this.buildOrderBy(params),
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
    });
    const countQuery = this.db
      .select({ count: count(contactSources.id) })
      .from(contactSources)
      .where(whereClause);

    const usageQuery = this.db
      .select({ sourceId: contacts.sourceId, count: count(contacts.id) })
      .from(contacts)
      .where(eq(contacts.organizationId, params.organizationId))
      .groupBy(contacts.sourceId);

    const [items, [{ count: totalItems }], usage] = await Promise.all([
      itemsQuery,
      countQuery,
      usageQuery,
    ]);
    const usageBySource = new Map(usage.map((u) => [u.sourceId, u.count]));
    return paginatedResponse(
      items.map((item) => ({
        ...item,
        contactCount: usageBySource.get(item.id) ?? 0,
      })),
      totalItems,
      paginationQuery,
    );
  }

  async findOne(id: number, organizationId: number, options?: DbOptions) {
    const db = options?.tx ?? this.db;
    const source = await db.query.contactSources.findFirst({
      where: and(
        eq(contactSources.id, id),
        eq(contactSources.organizationId, organizationId),
      ),
    });
    if (!source) throw new NotFoundException('Not found');
    return source;
  }

  /** Seeds the default list for a new Organization (Onboarding). */
  async createDefaultsForOrganization(
    organizationId: number,
    options?: DbOptions,
  ) {
    const db = options?.tx ?? this.db;
    await db.insert(contactSources).values(
      DEFAULT_CONTACT_SOURCES.map(({ name, sort }) => ({
        name,
        sort,
        organizationId,
      })),
    );
  }

  /** Adds a Contact Source at position `sort` (default last). */
  async create(dto: CreateContactSourceServiceDto) {
    const { organizationId, name } = dto;
    return this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(contactSources)
        .values({ name, sort: 0, organizationId })
        .returning();
      const before = await this.inOrder(tx, organizationId);
      const after = moveTo(before, created.id, dto.sort);
      await persistPositions(tx, contactSources, before, after);
      return this.findOne(created.id, organizationId, { tx });
    });
  }

  /** Renames and/or moves a Contact Source. */
  async update(id: number, dto: UpdateContactSourceServiceDto) {
    const { organizationId, name, sort } = dto;
    return this.db.transaction(async (tx) => {
      await this.findOne(id, organizationId, { tx });
      if (name !== undefined) {
        await tx
          .update(contactSources)
          .set({ name })
          .where(eq(contactSources.id, id));
      }
      if (sort !== undefined) {
        const before = await this.inOrder(tx, organizationId);
        await persistPositions(
          tx,
          contactSources,
          before,
          moveTo(before, id, sort),
        );
      }
      return this.findOne(id, organizationId, { tx });
    });
  }

  async remove(id: number, organizationId: number) {
    return await this.db.transaction(async (tx) => {
      const current = await this.findOne(id, organizationId, { tx });

      // Guard: deleting a source in use would silently wipe the "Origen" of
      // every Contact pointing at it (the FK sets null).
      const [{ count: usageCount }] = await tx
        .select({ count: count(contacts.id) })
        .from(contacts)
        .where(eq(contacts.sourceId, id));

      if (usageCount > 0) {
        throw new BadRequestException(
          `No se puede eliminar: el origen está en uso por ${usageCount} ${
            usageCount === 1 ? 'contacto' : 'contactos'
          }.`,
        );
      }

      const before = await this.inOrder(tx, organizationId);
      await tx.delete(contactSources).where(eq(contactSources.id, id));
      await persistPositions(tx, contactSources, before, without(before, id));
      return current;
    });
  }

  private inOrder(db: DrizzleDatabase, organizationId: number) {
    return db.query.contactSources.findMany({
      where: eq(contactSources.organizationId, organizationId),
      orderBy: [asc(contactSources.sort), asc(contactSources.id)],
    });
  }

  private buildOrderBy(params: ContactSourceFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || [
      'sort',
      'asc',
    ];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    const column = contactSources[sortBy];
    if (column) return [sortOrder(column)];
    throw new BadRequestException('Invalid sortBy parameter');
  }
}
