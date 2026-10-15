import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, SQL } from 'drizzle-orm';
import {
  companies,
  contacts,
  interactionContacts,
  interactions,
  opportunities,
  type Interaction as InteractionRow,
  type NewInteraction,
} from '@workspace/shared/schemas';
import type { Interaction } from '@workspace/shared/types/interaction';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { stampInteractionCompany } from './interaction-company-stamp';
import type {
  CreateInteractionDto,
  InteractionActor,
  InteractionQueryParams,
  UpdateInteractionDto,
} from './interaction.dto';

const INTERACTION_WITH = {
  company: { columns: { id: true, name: true } },
  opportunity: { columns: { id: true, title: true } },
  createdByUser: { columns: { id: true, name: true } },
  contacts: {
    with: {
      contact: {
        columns: { id: true, name: true, role: true, companyId: true },
        with: { company: { columns: { id: true, name: true } } },
      },
    },
  },
} as const;

type InteractionWithRelations = InteractionRow & {
  company: { id: number; name: string } | null;
  opportunity: { id: number; title: string } | null;
  createdByUser: { id: number; name: string } | null;
  contacts: {
    contact: {
      id: number;
      name: string;
      role: string;
      companyId: number | null;
      company?: { id: number; name: string } | null;
    };
  }[];
};

/**
 * Interactions (commercial side). The Company is stamped once, at creation,
 * from the Interaction's own inputs (see stampInteractionCompany) and never
 * rewritten afterwards, so a Contact moving keeps past history in place.
 */
@Injectable()
export class InteractionService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  /** Newest first (by the day it happened). */
  async findAll(
    query: InteractionQueryParams,
    organizationId: number,
  ): Promise<Interaction[]> {
    const filters: SQL[] = [eq(interactions.organizationId, organizationId)];
    if (query.companyId != null) {
      filters.push(eq(interactions.companyId, query.companyId));
    }
    if (query.opportunityId != null) {
      filters.push(eq(interactions.opportunityId, query.opportunityId));
    }
    if (query.contactId != null) {
      filters.push(
        inArray(
          interactions.id,
          this.db
            .select({ id: interactionContacts.interactionId })
            .from(interactionContacts)
            .where(eq(interactionContacts.contactId, query.contactId)),
        ),
      );
    }
    const rows = await this.db.query.interactions.findMany({
      where: and(...filters),
      with: INTERACTION_WITH,
      orderBy: [desc(interactions.date), desc(interactions.id)],
    });
    return rows.map((row) => toResponse(row as InteractionWithRelations));
  }

  async findOne(id: number, organizationId: number): Promise<Interaction> {
    const row = await this.db.query.interactions.findFirst({
      where: and(
        eq(interactions.id, id),
        eq(interactions.organizationId, organizationId),
      ),
      with: INTERACTION_WITH,
    });
    if (!row) throw new NotFoundException('Not found');
    return toResponse(row as InteractionWithRelations);
  }

  async create(
    dto: CreateInteractionDto,
    actor: InteractionActor,
  ): Promise<Interaction> {
    const { organizationId } = actor;
    const contactIds = unique(dto.contactIds ?? []);
    const involved = await this.findContacts(contactIds, organizationId);
    const opportunityCompanyId = await this.findOpportunityCompany(
      dto.opportunityId,
      organizationId,
    );
    if (dto.companyId != null) {
      await this.assertCompanyInOrganization(dto.companyId, organizationId);
    }

    const stamp = stampInteractionCompany({
      companyId: dto.companyId,
      opportunityCompanyId,
      contactCompanyIds: involved.map((contact) => contact.companyId),
    });
    if (stamp.violation) throw new BadRequestException(stamp.violation);

    const values = {
      organizationId,
      type: dto.type,
      date: dto.date,
      summary: dto.summary,
      companyId: stamp.companyId,
      opportunityId: dto.opportunityId ?? null,
      createdBy: actor.userId,
    } as NewInteraction;
    const id = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(interactions)
        .values(values)
        .returning({ id: interactions.id });
      if (contactIds.length > 0) {
        await tx.insert(interactionContacts).values(
          contactIds.map((contactId) => ({
            interactionId: created.id,
            contactId,
          })),
        );
      }
      return created.id;
    });
    return this.findOne(id, organizationId);
  }

  /** Edits what happened and who it was with; the Company stays as recorded. */
  async update(
    id: number,
    dto: UpdateInteractionDto,
    actor: InteractionActor,
  ): Promise<Interaction> {
    const { organizationId } = actor;
    const existing = await this.findOne(id, organizationId);
    const contactIds =
      dto.contactIds === undefined ? undefined : unique(dto.contactIds);
    if (contactIds !== undefined) {
      const involved = await this.findContacts(contactIds, organizationId);
      const stamp = stampInteractionCompany({
        companyId: existing.companyId,
        contactCompanyIds: involved.map((contact) => contact.companyId),
      });
      if (stamp.violation) throw new BadRequestException(stamp.violation);
    }

    await this.db.transaction(async (tx) => {
      const set: Partial<InteractionRow> = { updatedAt: new Date() };
      if (dto.type !== undefined) set.type = dto.type;
      if (dto.date !== undefined) set.date = dto.date;
      if (dto.summary !== undefined) set.summary = dto.summary;
      await tx
        .update(interactions)
        .set(set)
        .where(
          and(
            eq(interactions.id, id),
            eq(interactions.organizationId, organizationId),
          ),
        );
      if (contactIds !== undefined) {
        await tx
          .delete(interactionContacts)
          .where(eq(interactionContacts.interactionId, id));
        if (contactIds.length > 0) {
          await tx
            .insert(interactionContacts)
            .values(
              contactIds.map((contactId) => ({ interactionId: id, contactId })),
            );
        }
      }
    });
    return this.findOne(id, organizationId);
  }

  async remove(id: number, organizationId: number): Promise<Interaction> {
    const existing = await this.findOne(id, organizationId);
    await this.db
      .delete(interactions)
      .where(
        and(
          eq(interactions.id, id),
          eq(interactions.organizationId, organizationId),
        ),
      );
    return existing;
  }

  /** The involved Contacts with their current Company; all must exist here. */
  private async findContacts(contactIds: number[], organizationId: number) {
    if (contactIds.length === 0) return [];
    const found = await this.db.query.contacts.findMany({
      columns: { id: true, companyId: true },
      where: and(
        eq(contacts.organizationId, organizationId),
        inArray(contacts.id, contactIds),
      ),
    });
    if (found.length !== contactIds.length) {
      throw new BadRequestException('El contacto no existe.');
    }
    return found;
  }

  private async findOpportunityCompany(
    opportunityId: number | null | undefined,
    organizationId: number,
  ): Promise<number | null> {
    if (opportunityId == null) return null;
    const opportunity = await this.db.query.opportunities.findFirst({
      columns: { companyId: true },
      where: and(
        eq(opportunities.id, opportunityId),
        eq(opportunities.organizationId, organizationId),
      ),
    });
    if (!opportunity) {
      throw new BadRequestException('La oportunidad no existe.');
    }
    return opportunity.companyId;
  }

  private async assertCompanyInOrganization(
    companyId: number,
    organizationId: number,
  ) {
    const company = await this.db.query.companies.findFirst({
      columns: { id: true },
      where: and(
        eq(companies.id, companyId),
        eq(companies.organizationId, organizationId),
      ),
    });
    if (!company) throw new BadRequestException('La empresa no existe.');
  }
}

function unique(ids: number[]): number[] {
  return [...new Set(ids)];
}

function toResponse(row: InteractionWithRelations): Interaction {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    summary: row.summary,
    companyId: row.companyId,
    opportunityId: row.opportunityId,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    company: row.company,
    opportunity: row.opportunity,
    createdByUser: row.createdByUser,
    contacts: row.contacts.map(({ contact }) => ({
      id: contact.id,
      name: contact.name,
      role: contact.role,
      companyId: contact.companyId,
      company: contact.company ?? null,
    })),
  };
}
