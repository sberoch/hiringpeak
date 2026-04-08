import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, SQL } from 'drizzle-orm';
import {
  candidateVacancies,
  CandidateVacancy as CandidateVacancySchema,
  candidateVacancyStatuses,
  CandidateVacancyStatus,
  candidates,
  Candidate,
  Vacancy,
  Company,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CandidateVacancyFindAllServiceParams,
  CreateCandidateVacancyServiceDto,
  UpdateCandidateVacancyServiceDto,
} from './candidatevacancy.dto';

type CandidateVacancyQueryResult = CandidateVacancySchema & {
  candidate: Candidate;
  vacancy: Vacancy & {
    company: Company;
  };
  candidateVacancyStatus: CandidateVacancyStatus;
};

type CandidateVacancyApiResponse = Omit<
  CandidateVacancyQueryResult,
  'candidateVacancyStatus'
> & {
  status: CandidateVacancyStatus;
};

@Injectable()
export class CandidateVacancyService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CandidateVacancyFindAllServiceParams,
  ): Promise<PaginatedResponse<CandidateVacancyApiResponse>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.candidateVacancies.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: {
        candidate: true,
        vacancy: {
          with: {
            company: true,
          },
        },
        candidateVacancyStatus: true,
      },
    });

    const countQuery = this.db
      .select({ count: count(candidateVacancies.id) })
      .from(candidateVacancies)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);
    const parsedItems = items.map((item) => this.transformQueryResult(item));
    return paginatedResponse(parsedItems, totalItems, paginationQuery);
  }

  async findOne(id: number, organizationId: number) {
    const candidateVacancy = await this.db.query.candidateVacancies.findFirst({
      where: and(
        eq(candidateVacancies.id, id),
        eq(candidateVacancies.organizationId, organizationId),
      ),
      with: {
        candidate: true,
        vacancy: {
          with: {
            company: true,
          },
        },
        candidateVacancyStatus: true,
      },
    });
    if (!candidateVacancy) throw new NotFoundException('Not found');
    return this.transformQueryResult(candidateVacancy);
  }

  async create(dto: CreateCandidateVacancyServiceDto) {
    const createdCandidateVacancy = await this.db.transaction(async (tx) => {
      const existingCandidateVacancy =
        await tx.query.candidateVacancies.findFirst({
          where: and(
            eq(candidateVacancies.candidateId, dto.candidateId),
            eq(candidateVacancies.vacancyId, dto.vacancyId),
          ),
        });

      if (existingCandidateVacancy) {
        throw new BadRequestException(
          'Candidate is already associated with this vacancy',
        );
      }

      const status = await tx.query.candidateVacancyStatuses.findFirst({
        where: eq(candidateVacancyStatuses.id, dto.candidateVacancyStatusId),
      });

      const maxSortStatus = await tx.query.candidateVacancyStatuses.findFirst({
        orderBy: desc(candidateVacancyStatuses.sort),
      });

      if (status && maxSortStatus && status.sort === maxSortStatus.sort) {
        await tx
          .update(candidates)
          .set({ isInCompanyViaPratt: true } as any)
          .where(eq(candidates.id, dto.candidateId));
      }

      const candidateVacancyValues = {
        ...dto,
        rejectionReason: status?.isRejection
          ? this.normalizeRejectionReason(dto.rejectionReason)
          : null,
      } as typeof candidateVacancies.$inferInsert;

      const [candidateVacancy] = await tx
        .insert(candidateVacancies)
        .values(candidateVacancyValues)
        .returning();

      return candidateVacancy;
    });

    return this.findOne(
      createdCandidateVacancy.id,
      createdCandidateVacancy.organizationId,
    );
  }

  async update(id: number, dto: UpdateCandidateVacancyServiceDto) {
    const candidateVacancy = await this.db.transaction(async (tx) => {
      const currentCandidateVacancy =
        await tx.query.candidateVacancies.findFirst({
          where: and(
            eq(candidateVacancies.id, id),
            eq(candidateVacancies.organizationId, dto.organizationId),
          ),
        });

      if (!currentCandidateVacancy) {
        throw new NotFoundException('Not found');
      }

      if (dto.candidateVacancyStatusId) {
        const status = await tx.query.candidateVacancyStatuses.findFirst({
          where: eq(candidateVacancyStatuses.id, dto.candidateVacancyStatusId),
        });

        const maxSortStatus = await tx.query.candidateVacancyStatuses.findFirst(
          {
            orderBy: desc(candidateVacancyStatuses.sort),
          },
        );

        if (status && maxSortStatus && status.sort === maxSortStatus.sort) {
          const candidateId =
            dto.candidateId ??
            currentCandidateVacancy.candidateId;

          if (candidateId) {
            await tx
              .update(candidates)
              .set({ isInCompanyViaPratt: true } as any)
              .where(eq(candidates.id, candidateId));
          }
        }
      }

      const { organizationId, ...updateFields } = dto;

      const nextStatusId =
        dto.candidateVacancyStatusId ??
        currentCandidateVacancy.candidateVacancyStatusId;
      const nextStatus = await tx.query.candidateVacancyStatuses.findFirst({
        where: eq(candidateVacancyStatuses.id, nextStatusId),
      });

      if (nextStatus?.isRejection) {
        const isStatusChange =
          dto.candidateVacancyStatusId !== undefined &&
          dto.candidateVacancyStatusId !==
            currentCandidateVacancy.candidateVacancyStatusId;
        if (dto.rejectionReason !== undefined || isStatusChange) {
          updateFields.rejectionReason = this.normalizeRejectionReason(
            dto.rejectionReason,
          );
        }
      } else {
        updateFields.rejectionReason = null;
      }

      const [updatedCandidateVacancy] = await tx
        .update(candidateVacancies)
        .set(updateFields)
        .where(
          and(
            eq(candidateVacancies.id, id),
            eq(candidateVacancies.organizationId, organizationId),
          ),
        )
        .returning();

      return updatedCandidateVacancy;
    });

    return this.findOne(candidateVacancy.id, candidateVacancy.organizationId);
  }

  async remove(id: number, organizationId: number) {
    const [candidateVacancy] = await this.db
      .delete(candidateVacancies)
      .where(
        and(
          eq(candidateVacancies.id, id),
          eq(candidateVacancies.organizationId, organizationId),
        ),
      )
      .returning();
    return candidateVacancy;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */
  private buildOrderBy(params: CandidateVacancyFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = candidateVacancies[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(params: CandidateVacancyFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(
      eq(candidateVacancies.organizationId, params.organizationId),
    );

    if (params.id) {
      filters.push(eq(candidateVacancies.id, params.id));
    }

    if (params.candidateIds && params.candidateIds.length > 0) {
      filters.push(
        inArray(candidateVacancies.candidateId, params.candidateIds),
      );
    }

    if (params.candidateId) {
      filters.push(eq(candidateVacancies.candidateId, params.candidateId));
    }

    if (params.vacancyId) {
      filters.push(eq(candidateVacancies.vacancyId, params.vacancyId));
    }

    if (params.candidateVacancyStatusId) {
      filters.push(
        eq(
          candidateVacancies.candidateVacancyStatusId,
          params.candidateVacancyStatusId,
        ),
      );
    }

    if (params.notes) {
      filters.push(ilike(candidateVacancies.notes, params.notes));
    }

    if (params.rejectionReason) {
      filters.push(
        ilike(candidateVacancies.rejectionReason, params.rejectionReason),
      );
    }

    return and(...filters);
  }

  private transformQueryResult(
    result: CandidateVacancyQueryResult,
  ): CandidateVacancyApiResponse {
    const { candidateVacancyStatus, ...rest } = result;
    return {
      ...rest,
      status: candidateVacancyStatus,
    };
  }

  private normalizeRejectionReason(rejectionReason?: string | null) {
    const normalized = rejectionReason?.trim();
    return normalized ? normalized : null;
  }
}
