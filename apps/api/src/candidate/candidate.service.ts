import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  gt,
  ilike,
  inArray,
  lte,
  SQL,
  not,
  sql,
} from 'drizzle-orm';
import {
  Area,
  Candidate,
  candidateAreas,
  candidateFilesRelation,
  candidateIndustries,
  candidates,
  candidateSeniorities,
  CandidateFile,
  CandidateSource,
  Industry,
  Seniority,
  Blacklist,
  blacklists,
  Comment,
  User,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CandidateQueryParams,
  CreateCandidateServiceDto,
  BlacklistCandidateDto,
  UpdateCandidateServiceDto,
} from './candidate.dto';

type CandidateQueryResult = Candidate & {
  source: CandidateSource;
  candidateAreas: Array<{ area: Area }>;
  candidateIndustries: Array<{ industry: Industry }>;
  candidateSeniorities: Array<{ seniority: Seniority }>;
  candidateFilesRelation: Array<{ file: CandidateFile }>;
  blacklist: Blacklist;
  comments: Comment[];
};

export type CandidateApiResponse = Omit<Candidate, 'deleted'> & {
  source: CandidateSource;
  areas: Area[];
  industries: Industry[];
  seniorities: Seniority[];
  files: CandidateFile[];
  blacklist: Blacklist;
  comments: Comment[];
};

@Injectable()
export class CandidateService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: CandidateQueryParams,
  ): Promise<PaginatedResponse<CandidateApiResponse>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.candidates.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: {
        source: true,
        candidateAreas: { with: { area: true } },
        candidateIndustries: { with: { industry: true } },
        candidateSeniorities: { with: { seniority: true } },
        candidateFilesRelation: { with: { file: true } },
        blacklist: true,
        comments: true,
      },
    });

    const countQuery = this.db
      .select({ count: count(candidates.id) })
      .from(candidates)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    const parsedItems = items.map(this.transformQueryResult);
    return paginatedResponse(parsedItems, totalItems, paginationQuery);
  }

  async findOne(id: number) {
    const candidate = await this.db.query.candidates.findFirst({
      where: eq(candidates.id, id),
      with: {
        source: true,
        candidateAreas: { with: { area: true } },
        candidateIndustries: { with: { industry: true } },
        candidateSeniorities: { with: { seniority: true } },
        candidateFilesRelation: { with: { file: true } },
        blacklist: true,
        comments: true,
      },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return this.transformQueryResult(candidate);
  }

  async existsByName(
    name: string,
  ): Promise<{ exists: boolean; candidate: CandidateApiResponse | null }> {
    const candidate = await this.db.query.candidates.findFirst({
      where: and(ilike(candidates.name, name), eq(candidates.deleted, false)),
      with: {
        source: true,
        candidateAreas: { with: { area: true } },
        candidateIndustries: { with: { industry: true } },
        candidateSeniorities: { with: { seniority: true } },
        candidateFilesRelation: { with: { file: true } },
        blacklist: true,
        comments: true,
      },
    });
    return {
      exists: !!candidate,
      candidate: candidate ? this.transformQueryResult(candidate) : null,
    };
  }

  async create(dto: CreateCandidateServiceDto) {
    const {
      organizationId,
      areaIds,
      industryIds,
      seniorityIds,
      fileIds,
      ...candidateRow
    } = dto;
    return this.db.transaction(async (tx) => {
      const [candidate] = await tx
        .insert(candidates)
        .values({ ...candidateRow, organizationId })
        .returning();

      if (!candidate) throw new Error('Error creating candidate');

      if (areaIds?.length) {
        await tx.insert(candidateAreas).values(
          areaIds.map((areaId) => ({
            candidateId: candidate.id,
            areaId,
          })),
        );
      }

      if (industryIds?.length) {
        await tx.insert(candidateIndustries).values(
          industryIds.map((industryId) => ({
            candidateId: candidate.id,
            industryId,
          })),
        );
      }

      if (seniorityIds?.length) {
        await tx.insert(candidateSeniorities).values(
          seniorityIds.map((seniorityId) => ({
            candidateId: candidate.id,
            seniorityId,
          })),
        );
      }

      if (fileIds?.length) {
        await tx.insert(candidateFilesRelation).values(
          fileIds.map((fileId) => ({
            candidateId: candidate.id,
            fileId,
          })),
        );
      }

      return candidate;
    });
  }

  async blacklist(
    blacklistCandidateDto: BlacklistCandidateDto,
    user: User,
    id: number,
    organizationId: number,
  ) {
    await this.db.insert(blacklists).values({
      ...blacklistCandidateDto,
      candidateId: id,
      userId: user.id,
      organizationId,
    });
    return this.findOne(id);
  }

  async update(id: number, dto: UpdateCandidateServiceDto) {
    const {
      organizationId,
      areaIds,
      industryIds,
      seniorityIds,
      fileIds,
      ...updateFields
    } = dto;
    const candidate = await this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(candidates)
        .set(updateFields)
        .where(
          and(eq(candidates.id, id), eq(candidates.organizationId, organizationId)),
        )
        .returning();

      if (areaIds?.length) {
        await tx
          .delete(candidateAreas)
          .where(eq(candidateAreas.candidateId, id));
        await tx.insert(candidateAreas).values(
          areaIds.map((areaId) => ({
            candidateId: id,
            areaId,
          })),
        );
      }

      if (industryIds?.length) {
        await tx
          .delete(candidateIndustries)
          .where(eq(candidateIndustries.candidateId, id));
        await tx.insert(candidateIndustries).values(
          industryIds.map((industryId) => ({
            candidateId: id,
            industryId,
          })),
        );
      }

      if (seniorityIds?.length) {
        await tx
          .delete(candidateSeniorities)
          .where(eq(candidateSeniorities.candidateId, id));
        await tx.insert(candidateSeniorities).values(
          seniorityIds.map((seniorityId) => ({
            candidateId: id,
            seniorityId,
          })),
        );
      }

      if (fileIds !== undefined) {
        await tx
          .delete(candidateFilesRelation)
          .where(eq(candidateFilesRelation.candidateId, id));
        if (fileIds.length > 0) {
          await tx.insert(candidateFilesRelation).values(
            fileIds.map((fileId) => ({
              candidateId: id,
              fileId,
            })),
          );
        }
      }
      return updated;
    });
    return candidate;
  }

  async remove(id: number) {
    const candidate = await this.db.query.candidates.findFirst({
      where: eq(candidates.id, id),
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    const [removedCandidate] = await this.db
      .update(candidates)
      .set({
        deleted: true,
        name: `${candidate.name} (deleted)`,
      } as Partial<Candidate>)
      .where(eq(candidates.id, id))
      .returning();
    return removedCandidate;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */

  private transformQueryResult(
    result: CandidateQueryResult,
  ): CandidateApiResponse {
    const {
      candidateAreas,
      candidateIndustries,
      candidateSeniorities,
      candidateFilesRelation,
      source,
      blacklist,
      comments,
      ...rest
    } = result;
    return {
      ...rest,
      source: result.source,
      areas: result.candidateAreas.map((ca) => ca.area).filter(Boolean), // Extract area and filter nulls if any join issue
      industries: result.candidateIndustries
        .map((ci) => ci.industry)
        .filter(Boolean),
      seniorities: result.candidateSeniorities
        .map((cs) => cs.seniority)
        .filter(Boolean),
      files: result.candidateFilesRelation
        .map((cfj) => cfj.file)
        .filter(Boolean),
      blacklist: result.blacklist,
      comments: result.comments,
    };
  }

  private buildOrderBy(params: CandidateQueryParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = candidates[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(query: CandidateQueryParams) {
    const filters: SQL[] = [];
    if (query.id) {
      filters.push(eq(candidates.id, query.id));
    }
    if (query.name) {
      filters.push(ilike(candidates.name, `%${query.name}%`));
    }
    if (query.minimumAge) {
      const currentDate = new Date();
      const minBirthDate = new Date(
        currentDate.getFullYear() - query.minimumAge,
        currentDate.getMonth(),
        currentDate.getDate(),
      );
      const minBirthDateString = `${minBirthDate.getFullYear()}-${String(minBirthDate.getMonth() + 1).padStart(2, '0')}-${String(minBirthDate.getDate()).padStart(2, '0')}`;
      filters.push(lte(candidates.dateOfBirth, minBirthDateString));
    }
    if (query.maximumAge) {
      const currentDate = new Date();
      const maxBirthDate = new Date(
        currentDate.getFullYear() - query.maximumAge - 1,
        currentDate.getMonth(),
        currentDate.getDate(),
      );
      const maxBirthDateString = `${maxBirthDate.getFullYear()}-${String(maxBirthDate.getMonth() + 1).padStart(2, '0')}-${String(maxBirthDate.getDate()).padStart(2, '0')}`;
      filters.push(gt(candidates.dateOfBirth, maxBirthDateString));
    }
    if (query.gender) {
      filters.push(ilike(candidates.gender, `%${query.gender}%`));
    }
    if (query.shortDescription) {
      filters.push(
        ilike(candidates.shortDescription, `%${query.shortDescription}%`),
      );
    }
    if (query.email) {
      filters.push(ilike(candidates.email, `%${query.email}%`));
    }
    if (query.linkedin) {
      filters.push(ilike(candidates.linkedin, `%${query.linkedin}%`));
    }
    if (query.address) {
      filters.push(ilike(candidates.address, `%${query.address}%`));
    }
    if (query.phone) {
      filters.push(ilike(candidates.phone, `%${query.phone}%`));
    }
    if (query.countries) {
      const arr = query.countries;
      const sqlArray = sql`ARRAY[${sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      )}]::text[]`;
      const countriesSubquery = this.db
        .select({ candidateId: candidates.id })
        .from(candidates)
        .where(sql`${candidates.countries} && ${sqlArray}`)
        .as('countries_subquery');

      filters.push(
        inArray(
          candidates.id,
          this.db
            .select({ id: countriesSubquery.candidateId })
            .from(countriesSubquery),
        ),
      );
    }
    if (query.provinces) {
      const arr = query.provinces;
      const sqlArray = sql`ARRAY[${sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      )}]::text[]`;
      const provincesSubquery = this.db
        .select({ candidateId: candidates.id })
        .from(candidates)
        .where(sql`${candidates.provinces} && ${sqlArray}`)
        .as('provinces_subquery');

      filters.push(
        inArray(
          candidates.id,
          this.db
            .select({ id: provincesSubquery.candidateId })
            .from(provincesSubquery),
        ),
      );
    }
    if (query.languages) {
      const arr = query.languages;
      const sqlArray = sql`ARRAY[${sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      )}]::text[]`;
      const languagesSubquery = this.db
        .select({ candidateId: candidates.id })
        .from(candidates)
        .where(sql`${candidates.languages} && ${sqlArray}`)
        .as('languages_subquery');

      filters.push(
        inArray(
          candidates.id,
          this.db
            .select({ id: languagesSubquery.candidateId })
            .from(languagesSubquery),
        ),
      );
    }
    if (query.minimumStars) {
      filters.push(gte(candidates.stars, String(query.minimumStars)));
    }
    if (query.maximumStars) {
      filters.push(lte(candidates.stars, String(query.maximumStars)));
    }
    if (!query.blacklisted || query.blacklisted.toString() === 'false') {
      const blacklistSubquery = this.db
        .select({ candidateId: blacklists.candidateId })
        .from(blacklists);
      filters.push(not(inArray(candidates.id, blacklistSubquery)));
    }
    if (query.sourceId) {
      filters.push(eq(candidates.sourceId, query.sourceId));
    }

    // Add filters for areaIds, industryIds, and seniorityIds
    if (query.areaIds && query.areaIds.length > 0) {
      const areaSubquery = this.db
        .select({ candidateId: candidateAreas.candidateId })
        .from(candidateAreas)
        .where(inArray(candidateAreas.areaId, query.areaIds))
        .as('area_subquery');

      filters.push(
        inArray(
          candidates.id,
          this.db.select({ id: areaSubquery.candidateId }).from(areaSubquery),
        ),
      );
    }

    if (query.industryIds && query.industryIds.length > 0) {
      const industrySubquery = this.db
        .select({ candidateId: candidateIndustries.candidateId })
        .from(candidateIndustries)
        .where(inArray(candidateIndustries.industryId, query.industryIds))
        .as('industry_subquery');

      filters.push(
        inArray(
          candidates.id,
          this.db
            .select({ id: industrySubquery.candidateId })
            .from(industrySubquery),
        ),
      );
    }

    if (query.seniorityIds && query.seniorityIds.length > 0) {
      const senioritySubquery = this.db
        .select({ candidateId: candidateSeniorities.candidateId })
        .from(candidateSeniorities)
        .where(inArray(candidateSeniorities.seniorityId, query.seniorityIds))
        .as('seniority_subquery');

      filters.push(
        inArray(
          candidates.id,
          this.db
            .select({ id: senioritySubquery.candidateId })
            .from(senioritySubquery),
        ),
      );
    }

    if (query.deleted) {
      filters.push(eq(candidates.deleted, query.deleted));
    } else {
      filters.push(eq(candidates.deleted, false));
    }

    if (query.isInCompanyViaPratt) {
      filters.push(
        eq(candidates.isInCompanyViaPratt, query.isInCompanyViaPratt),
      );
    }

    return filters.length > 0 ? and(...filters) : undefined;
  }
}
