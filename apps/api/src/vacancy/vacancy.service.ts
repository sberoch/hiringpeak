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
  ilike,
  inArray,
  lte,
  or,
  SQL,
  sql,
} from 'drizzle-orm';
import {
  Area,
  Industry,
  Seniority,
  Blacklist,
  Candidate,
  candidates,
  CandidateSource,
  CandidateVacancy as CandidateVacancySchema,
  candidateVacancies,
  CandidateVacancyStatus,
  candidateVacancyStatuses,
  Comment,
  RejectionReason,
  Company,
  User,
  vacancies,
  Vacancy,
  vacancyFilters,
  VacancyFilters,
  VacancyFiltersArea,
  vacancyFiltersAreas,
  vacancyFiltersIndustries,
  VacancyFiltersIndustry,
  vacancyFiltersSeniorities,
  VacancyFiltersSeniority,
  vacancyStatuses,
  VacancyStatus,
} from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';
import { PaginatedResponse } from '../common/pagination/pagination.params';
import {
  buildPaginationQuery,
  paginatedResponse,
} from '../common/pagination/pagination.utils';
import {
  CloseVacancyServiceDto,
  CreateVacancyServiceDto,
  CreateVacancyRecordDto,
  UpdateVacancyServiceDto,
  VacancyFindAllServiceParams,
  VacancyListReportServiceParams,
} from './vacancy.dto';
import type { VacancyListReportSourceRow } from './vacancy-list-report.types';

type VacancyQueryResult = Omit<Vacancy, 'assignedTo' | 'createdBy'> & {
  status: VacancyStatus;
  filters: VacancyFilters & {
    areaIds: Array<VacancyFiltersArea & { area: Area }>;
    industryIds: Array<VacancyFiltersIndustry & { industry: Industry }>;
    seniorityIds: Array<VacancyFiltersSeniority & { seniority: Seniority }>;
  };
  company: Company;
  candidateVacancies: Array<
    CandidateVacancySchema & {
      candidate: Candidate & {
        source: CandidateSource | null;
      };
      candidateVacancyStatus: CandidateVacancyStatus;
      rejectionReason: RejectionReason | null;
    }
  >;
  createdBy: User;
  assignedTo: User;
};

/** Drizzle shape returned by the report finders (full candidate graph). */
type ReportQueryResult = Omit<Vacancy, 'assignedTo' | 'createdBy'> & {
  status: VacancyStatus;
  filters: VacancyFilters & {
    areaIds: Array<VacancyFiltersArea & { area: Area }>;
    industryIds: Array<VacancyFiltersIndustry & { industry: Industry }>;
    seniorityIds: Array<VacancyFiltersSeniority & { seniority: Seniority }>;
  };
  company: Company;
  candidateVacancies: Array<
    CandidateVacancySchema & {
      candidate: Candidate & {
        source: CandidateSource | null;
        candidateAreas: Array<{ area: Area }>;
        candidateIndustries: Array<{ industry: Industry }>;
        candidateSeniorities: Array<{ seniority: Seniority }>;
        blacklist: Blacklist | null;
        comments: Array<Comment & { user: User | null }>;
      };
      candidateVacancyStatus: CandidateVacancyStatus;
      rejectionReason: RejectionReason | null;
    }
  >;
  createdBy: User;
  assignedTo: User;
};

export type VacancyApiResponse = Omit<Vacancy, 'assignedTo' | 'createdBy'> & {
  status: VacancyStatus;
  filters:
    | (VacancyFilters & {
        areas: Area[];
        industries: Industry[];
        seniorities: Seniority[];
      })
    | null;
  company: Company;
  candidates: Array<
    CandidateVacancySchema & {
      candidate: Candidate & {
        source: CandidateSource | null;
      };
      status: CandidateVacancyStatus;
      rejectionReason: RejectionReason | null;
    }
  >;
  createdBy: Omit<User, 'password'>;
  assignedTo: Omit<User, 'password'>;
};

/**
 * Lean shape served by the list endpoint (`findAll`). The list screens only
 * render counts, a status breakdown, and a handful of avatars — so instead of
 * hydrating every candidacy with its full candidate graph, the list carries
 * aggregates plus the most recent candidacies (capped). Consumers needing the
 * full candidacy array (kanban, simulate, wizard) use `findOne`.
 */
export type VacancyListItemApiResponse = Omit<
  VacancyApiResponse,
  'candidates'
> & {
  candidateCount: number;
  candidateStatusCounts: Array<{ name: string; count: number }>;
  recentCandidates: Array<{
    id: number;
    candidate: Pick<Candidate, 'id' | 'name' | 'image'>;
    status: Pick<CandidateVacancyStatus, 'id' | 'name'>;
  }>;
};

type VacancyListQueryResult = Omit<VacancyQueryResult, 'candidateVacancies'>;

/** How many candidacies the list ships per Vacancy (avatar stack + recent list). */
const RECENT_CANDIDACIES_LIMIT = 5;

/**
 * Per-candidacy row for the Excel **Report Format** — the full dump. Unlike the
 * client-facing PDF (which omits internal-only fields), this carries everything:
 * the candidate's taxonomy, plus the internal-only **Blacklist** and **Comments**
 * the PDF never surfaces. Backed by `findOneForReport` /
 * `findAllByCompanyIdForReport`, NOT the lean `findOne` used by the detail page.
 */
export type ReportCandidacyRow = Omit<
  VacancyApiResponse['candidates'][number],
  'candidate'
> & {
  candidate: Candidate & {
    source: CandidateSource | null;
    areas: Area[];
    industries: Industry[];
    seniorities: Seniority[];
    blacklist: Blacklist | null;
    comments: Array<Comment & { user: Pick<User, 'name'> | null }>;
  };
};

export type VacancyReportFullResponse = Omit<
  VacancyApiResponse,
  'candidates'
> & {
  candidates: ReportCandidacyRow[];
};

@Injectable()
export class VacancyService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  async findAll(
    params: VacancyFindAllServiceParams,
  ): Promise<PaginatedResponse<VacancyListItemApiResponse>> {
    const paginationQuery = buildPaginationQuery(params);
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const itemsQuery = this.db.query.vacancies.findMany({
      where: whereClause,
      orderBy: orderClause,
      limit: paginationQuery.limit,
      offset: paginationQuery.offset,
      with: {
        status: true,
        filters: {
          with: {
            areaIds: {
              with: {
                area: true,
              },
            },
            industryIds: {
              with: {
                industry: true,
              },
            },
            seniorityIds: {
              with: {
                seniority: true,
              },
            },
          },
        },
        company: true,
        createdBy: true,
        assignedTo: true,
      },
    });

    const countQuery = this.db
      .select({ count: count(vacancies.id) })
      .from(vacancies)
      .where(whereClause);

    const [items, [{ count: totalItems }]] = await Promise.all([
      itemsQuery,
      countQuery,
    ]);

    const vacancyIds = items.map((vacancy) => vacancy.id);
    const [statusCounts, recentCandidacies] = await Promise.all([
      this.countCandidaciesByVacancyAndStatus(vacancyIds),
      this.findRecentCandidaciesByVacancy(vacancyIds),
    ]);

    const parsedItems = items.map((item) =>
      this.transformListQueryResult(
        item,
        statusCounts.get(item.id) ?? [],
        recentCandidacies.get(item.id) ?? [],
      ),
    );
    return paginatedResponse(parsedItems, totalItems, paginationQuery);
  }

  /**
   * Candidacy counts per Vacancy broken down by candidacy status, excluding
   * soft-deleted Candidates. Ordered by the statuses' pipeline `sort` so the
   * list's status badges render in pipeline order.
   */
  private async countCandidaciesByVacancyAndStatus(
    vacancyIds: number[],
  ): Promise<Map<number, Array<{ name: string; count: number }>>> {
    const countsByVacancy = new Map<
      number,
      Array<{ name: string; count: number }>
    >();
    if (vacancyIds.length === 0) {
      return countsByVacancy;
    }

    const rows = await this.db
      .select({
        vacancyId: candidateVacancies.vacancyId,
        statusName: candidateVacancyStatuses.name,
        statusSort: candidateVacancyStatuses.sort,
        value: count(candidateVacancies.id),
      })
      .from(candidateVacancies)
      .innerJoin(candidates, eq(candidates.id, candidateVacancies.candidateId))
      .innerJoin(
        candidateVacancyStatuses,
        eq(
          candidateVacancyStatuses.id,
          candidateVacancies.candidateVacancyStatusId,
        ),
      )
      .where(
        and(
          inArray(candidateVacancies.vacancyId, vacancyIds),
          eq(candidates.deleted, false),
        ),
      )
      .groupBy(
        candidateVacancies.vacancyId,
        candidateVacancyStatuses.name,
        candidateVacancyStatuses.sort,
      )
      .orderBy(asc(candidateVacancyStatuses.sort));

    for (const row of rows) {
      const counts = countsByVacancy.get(row.vacancyId) ?? [];
      counts.push({ name: row.statusName, count: Number(row.value) });
      countsByVacancy.set(row.vacancyId, counts);
    }
    return countsByVacancy;
  }

  /**
   * The newest non-deleted candidacies per Vacancy, capped at
   * RECENT_CANDIDACIES_LIMIT each via a window function — feeds the list's
   * avatar stacks and "recent candidates" preview without hydrating the full
   * candidacy graph.
   */
  private async findRecentCandidaciesByVacancy(
    vacancyIds: number[],
  ): Promise<Map<number, VacancyListItemApiResponse['recentCandidates']>> {
    const recentByVacancy = new Map<
      number,
      VacancyListItemApiResponse['recentCandidates']
    >();
    if (vacancyIds.length === 0) {
      return recentByVacancy;
    }

    // Columns from joined tables need explicit aliases: inside a subquery the
    // three `id` columns (and the two `name`s) would otherwise collide.
    const ranked = this.db
      .select({
        id: candidateVacancies.id,
        vacancyId: candidateVacancies.vacancyId,
        candidateId: sql<number>`${candidates.id}`.as('candidate_id'),
        candidateName: sql<string>`${candidates.name}`.as('candidate_name'),
        candidateImage: sql<
          string | null
        >`${candidates.image}`.as('candidate_image'),
        statusId: sql<number>`${candidateVacancyStatuses.id}`.as('status_id'),
        statusName: sql<string>`${candidateVacancyStatuses.name}`.as(
          'status_name',
        ),
        rowNumber:
          sql<number>`row_number() over (partition by ${candidateVacancies.vacancyId} order by ${candidateVacancies.id} desc)`.as(
            'row_number',
          ),
      })
      .from(candidateVacancies)
      .innerJoin(candidates, eq(candidates.id, candidateVacancies.candidateId))
      .innerJoin(
        candidateVacancyStatuses,
        eq(
          candidateVacancyStatuses.id,
          candidateVacancies.candidateVacancyStatusId,
        ),
      )
      .where(
        and(
          inArray(candidateVacancies.vacancyId, vacancyIds),
          eq(candidates.deleted, false),
        ),
      )
      .as('ranked');

    const rows = await this.db
      .select()
      .from(ranked)
      .where(lte(ranked.rowNumber, RECENT_CANDIDACIES_LIMIT))
      .orderBy(asc(ranked.vacancyId), asc(ranked.rowNumber));

    for (const row of rows) {
      const recent = recentByVacancy.get(row.vacancyId) ?? [];
      recent.push({
        id: row.id,
        candidate: {
          id: row.candidateId,
          name: row.candidateName,
          image: row.candidateImage,
        },
        status: { id: row.statusId, name: row.statusName },
      });
      recentByVacancy.set(row.vacancyId, recent);
    }
    return recentByVacancy;
  }

  /**
   * Lean projection backing the Vacancy List Report: the SAME filter/sort
   * surface as `findAll` (reuses `buildWhereClause`/`buildOrderBy` so the
   * exported set exactly matches the screen) but UNPAGINATED and WITHOUT
   * hydrating the candidacy graph — the candidate count comes from a single
   * grouped aggregate. No row cap (see CONTEXT.md accepted-risk note).
   */
  async findAllForListReport(
    params: VacancyListReportServiceParams,
  ): Promise<VacancyListReportSourceRow[]> {
    const whereClause = this.buildWhereClause(params);
    const orderClause = this.buildOrderBy(params);

    const items = await this.db.query.vacancies.findMany({
      where: whereClause,
      orderBy: orderClause,
      with: {
        status: true,
        company: true,
        assignedTo: true,
        filters: {
          with: {
            areaIds: { with: { area: true } },
            industryIds: { with: { industry: true } },
            seniorityIds: { with: { seniority: true } },
          },
        },
      },
    });

    const candidateCounts = await this.countCandidaciesByVacancy(
      items.map((vacancy) => vacancy.id),
    );

    return items.map((vacancy) => ({
      id: vacancy.id,
      title: vacancy.title,
      companyName: vacancy.company?.name ?? '',
      statusName: vacancy.status?.name ?? '',
      ownerName: vacancy.assignedTo?.name ?? '',
      salary: vacancy.salary ?? null,
      seniorities:
        vacancy.filters?.seniorityIds
          ?.map((s) => s.seniority?.name)
          .filter((name): name is string => Boolean(name)) ?? [],
      areas:
        vacancy.filters?.areaIds
          ?.map((a) => a.area?.name)
          .filter((name): name is string => Boolean(name)) ?? [],
      industries:
        vacancy.filters?.industryIds
          ?.map((i) => i.industry?.name)
          .filter((name): name is string => Boolean(name)) ?? [],
      candidateCount: candidateCounts.get(vacancy.id) ?? 0,
      createdAt: vacancy.createdAt,
      closedAt: vacancy.closedAt,
    }));
  }

  /**
   * Candidacy counts per Vacancy, excluding soft-deleted Candidates — matching
   * the count the list screen shows (`transformQueryResult` drops deleted ones).
   */
  private async countCandidaciesByVacancy(
    vacancyIds: number[],
  ): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    if (vacancyIds.length === 0) {
      return counts;
    }

    const rows = await this.db
      .select({
        vacancyId: candidateVacancies.vacancyId,
        value: count(candidateVacancies.id),
      })
      .from(candidateVacancies)
      .innerJoin(candidates, eq(candidates.id, candidateVacancies.candidateId))
      .where(
        and(
          inArray(candidateVacancies.vacancyId, vacancyIds),
          eq(candidates.deleted, false),
        ),
      )
      .groupBy(candidateVacancies.vacancyId);

    for (const row of rows) {
      counts.set(row.vacancyId, Number(row.value));
    }
    return counts;
  }

  async findOne(id: number, organizationId: number) {
    const vacancy = await this.db.query.vacancies.findFirst({
      where: and(
        eq(vacancies.id, id),
        eq(vacancies.organizationId, organizationId),
      ),
      with: {
        status: true,
        filters: {
          with: {
            areaIds: {
              with: {
                area: true,
              },
            },
            industryIds: {
              with: {
                industry: true,
              },
            },
            seniorityIds: {
              with: {
                seniority: true,
              },
            },
          },
        },
        company: true,
        candidateVacancies: {
          with: {
            candidate: {
              with: {
                source: true,
                candidateAreas: { with: { area: true } },
                candidateIndustries: { with: { industry: true } },
                candidateSeniorities: { with: { seniority: true } },
              },
            },
            candidateVacancyStatus: true,
            rejectionReason: true,
          },
        },
        createdBy: true,
        assignedTo: true,
      },
    });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    return this.transformQueryResult(vacancy);
  }

  async findAllByCompanyId(
    companyId: number,
    organizationId: number,
  ): Promise<VacancyApiResponse[]> {
    const vacancyItems = await this.db.query.vacancies.findMany({
      where: and(
        eq(vacancies.companyId, companyId),
        eq(vacancies.organizationId, organizationId),
      ),
      orderBy: [desc(vacancies.id)],
      with: {
        status: true,
        filters: {
          with: {
            areaIds: {
              with: {
                area: true,
              },
            },
            industryIds: {
              with: {
                industry: true,
              },
            },
            seniorityIds: {
              with: {
                seniority: true,
              },
            },
          },
        },
        company: true,
        candidateVacancies: {
          with: {
            candidate: {
              with: {
                source: true,
              },
            },
            candidateVacancyStatus: true,
            rejectionReason: true,
          },
        },
        createdBy: true,
        assignedTo: true,
      },
    });

    return vacancyItems.map((vacancy) => this.transformQueryResult(vacancy));
  }

  /**
   * Full per-Vacancy graph backing the Excel Vacancy Report: everything
   * `findOne` loads PLUS the internal-only Blacklist + Comments the Excel
   * rendering dumps (the PDF omits them). Kept separate so the detail-page
   * `findOne` query stays lean.
   */
  async findOneForReport(
    id: number,
    organizationId: number,
  ): Promise<VacancyReportFullResponse> {
    const vacancy = await this.db.query.vacancies.findFirst({
      where: and(
        eq(vacancies.id, id),
        eq(vacancies.organizationId, organizationId),
      ),
      with: {
        status: true,
        filters: {
          with: {
            areaIds: { with: { area: true } },
            industryIds: { with: { industry: true } },
            seniorityIds: { with: { seniority: true } },
          },
        },
        company: true,
        candidateVacancies: {
          with: {
            candidate: {
              with: {
                source: true,
                candidateAreas: { with: { area: true } },
                candidateIndustries: { with: { industry: true } },
                candidateSeniorities: { with: { seniority: true } },
                blacklist: true,
                comments: { with: { user: true } },
              },
            },
            candidateVacancyStatus: true,
            rejectionReason: true,
          },
        },
        createdBy: true,
        assignedTo: true,
      },
    });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    return this.transformReportResult(vacancy as unknown as ReportQueryResult);
  }

  /** Full graph for every Vacancy of a Company, backing the Excel Company Report. */
  async findAllByCompanyIdForReport(
    companyId: number,
    organizationId: number,
  ): Promise<VacancyReportFullResponse[]> {
    const vacancyItems = await this.db.query.vacancies.findMany({
      where: and(
        eq(vacancies.companyId, companyId),
        eq(vacancies.organizationId, organizationId),
      ),
      orderBy: [desc(vacancies.id)],
      with: {
        status: true,
        filters: {
          with: {
            areaIds: { with: { area: true } },
            industryIds: { with: { industry: true } },
            seniorityIds: { with: { seniority: true } },
          },
        },
        company: true,
        candidateVacancies: {
          with: {
            candidate: {
              with: {
                source: true,
                candidateAreas: { with: { area: true } },
                candidateIndustries: { with: { industry: true } },
                candidateSeniorities: { with: { seniority: true } },
                blacklist: true,
                comments: { with: { user: true } },
              },
            },
            candidateVacancyStatus: true,
            rejectionReason: true,
          },
        },
        createdBy: true,
        assignedTo: true,
      },
    });

    return vacancyItems.map((vacancy) =>
      this.transformReportResult(vacancy as unknown as ReportQueryResult),
    );
  }

  private transformReportResult(
    result: ReportQueryResult,
  ): VacancyReportFullResponse {
    const { status, filters, company, candidateVacancies, ...rest } = result;
    const { password: _createdByPassword, ...createdBy } = result.createdBy;
    const { password: _assignedToPassword, ...assignedTo } = result.assignedTo;

    return {
      ...rest,
      status,
      filters: filters
        ? {
            ...filters,
            areas: filters.areaIds?.map((a) => a.area) ?? [],
            industries: filters.industryIds?.map((i) => i.industry) ?? [],
            seniorities: filters.seniorityIds?.map((s) => s.seniority) ?? [],
          }
        : null,
      company,
      candidates: candidateVacancies
        .map((cv) => {
          const { candidateVacancyStatus, candidate, ...cvRest } = cv;
          const {
            candidateAreas,
            candidateIndustries,
            candidateSeniorities,
            comments,
            ...candidateRest
          } = candidate;
          return {
            ...cvRest,
            candidate: {
              ...candidateRest,
              areas: candidateAreas?.map((ca) => ca.area) ?? [],
              industries: candidateIndustries?.map((ci) => ci.industry) ?? [],
              seniorities:
                candidateSeniorities?.map((cs) => cs.seniority) ?? [],
              // Strip the author down to a name — the Excel dumps internal
              // Comments, but never the User's password/credentials.
              comments: (comments ?? []).map((comment) => {
                const { user, ...commentRest } = comment;
                return {
                  ...commentRest,
                  user: user ? { name: user.name } : null,
                };
              }),
            },
            status: candidateVacancyStatus,
          };
        })
        .filter((c) => c.candidate.deleted === false),
      createdBy,
      assignedTo,
    };
  }

  async create(dto: CreateVacancyServiceDto) {
    return this.db.transaction(async (tx) => {
      return this.createRecord(tx, dto);
    });
  }

  async createRecord(tx: DrizzleDatabase, dto: CreateVacancyRecordDto) {
    const { organizationId, aiVacancyRunId, ...createVacancyDto } = dto;

    const [filters] = await tx
      .insert(vacancyFilters)
      .values({
        ...createVacancyDto.filters,
        organizationId,
      })
      .returning();

    if (!filters) throw new Error('Error creating filters');

    if (createVacancyDto.filters.seniorityIds?.length) {
      await tx.insert(vacancyFiltersSeniorities).values(
        createVacancyDto.filters.seniorityIds.map((seniorityId) => ({
          vacancyFiltersId: filters.id,
          seniorityId,
        })),
      );
    }

    if (createVacancyDto.filters.areaIds?.length) {
      await tx.insert(vacancyFiltersAreas).values(
        createVacancyDto.filters.areaIds.map((areaId) => ({
          vacancyFiltersId: filters.id,
          areaId,
        })),
      );
    }

    if (createVacancyDto.filters.industryIds?.length) {
      await tx.insert(vacancyFiltersIndustries).values(
        createVacancyDto.filters.industryIds.map((industryId) => ({
          vacancyFiltersId: filters.id,
          industryId,
        })),
      );
    }

    const status = await tx.query.vacancyStatuses.findFirst({
      where: eq(vacancyStatuses.id, createVacancyDto.statusId),
    });
    const closedAt = status?.isFinal ? new Date() : null;

    const vacancyValues = {
      title: createVacancyDto.title,
      description: createVacancyDto.description ?? '',
      salary: createVacancyDto.salary ?? null,
      statusId: createVacancyDto.statusId,
      vacancyFiltersId: filters.id,
      companyId: createVacancyDto.companyId,
      createdBy: createVacancyDto.createdBy,
      assignedTo: createVacancyDto.assignedTo,
      organizationId,
      closedAt,
      aiVacancyRunId: aiVacancyRunId ?? null,
    };

    const [vacancy] = await tx.insert(vacancies).values(vacancyValues).returning();

    if (!vacancy) throw new Error('Error creating vacancy');

    return vacancy;
  }

  async update(id: number, dto: UpdateVacancyServiceDto) {
    const { organizationId, ...updateVacancyDto } = dto;
    const { filters: _filters, ...vacancyFields } = updateVacancyDto;
    const vacancy = await this.db.transaction(async (tx) => {
      // If status is changing, check if the new status is final to auto-set closedAt
      const setFields: Record<string, unknown> = {
        ...vacancyFields,
        updatedAt: new Date(),
      };
      if (updateVacancyDto.statusId != null) {
        const newStatus = await tx.query.vacancyStatuses.findFirst({
          where: eq(vacancyStatuses.id, updateVacancyDto.statusId),
        });
        setFields.closedAt = newStatus?.isFinal ? new Date() : null;
      }

      const [vacancy] = await tx
        .update(vacancies)
        .set(setFields as Partial<Vacancy>)
        .where(
          and(
            eq(vacancies.id, id),
            eq(vacancies.organizationId, organizationId),
          ),
        )
        .returning();

      if (updateVacancyDto.filters) {
        const f = updateVacancyDto.filters;
        const filterScalars = {
          ...(f.minStars !== undefined && { minStars: f.minStars }),
          ...(f.gender !== undefined && { gender: f.gender }),
          ...(f.minAge !== undefined && { minAge: f.minAge }),
          ...(f.maxAge !== undefined && { maxAge: f.maxAge }),
          ...(f.countries !== undefined && { countries: f.countries }),
          ...(f.provinces !== undefined && { provinces: f.provinces }),
          ...(f.languages !== undefined && { languages: f.languages }),
        };
        if (Object.keys(filterScalars).length > 0) {
          await tx
            .update(vacancyFilters)
            .set(filterScalars as unknown as Partial<VacancyFilters>)
            .where(eq(vacancyFilters.id, vacancy.vacancyFiltersId));
        }
      }

      if (
        updateVacancyDto.filters?.seniorityIds?.length ||
        updateVacancyDto.filters?.seniorityIds === null
      ) {
        await tx
          .delete(vacancyFiltersSeniorities)
          .where(
            eq(
              vacancyFiltersSeniorities.vacancyFiltersId,
              vacancy.vacancyFiltersId,
            ),
          );
        if (updateVacancyDto.filters?.seniorityIds?.length) {
          await tx.insert(vacancyFiltersSeniorities).values(
            updateVacancyDto.filters.seniorityIds.map((seniorityId) => ({
              vacancyFiltersId: vacancy.vacancyFiltersId,
              seniorityId,
            })),
          );
        }
      }

      if (
        updateVacancyDto.filters?.areaIds?.length ||
        updateVacancyDto.filters?.areaIds === null
      ) {
        await tx
          .delete(vacancyFiltersAreas)
          .where(
            eq(vacancyFiltersAreas.vacancyFiltersId, vacancy.vacancyFiltersId),
          );
        if (updateVacancyDto.filters?.areaIds?.length) {
          await tx.insert(vacancyFiltersAreas).values(
            updateVacancyDto.filters.areaIds.map((areaId) => ({
              vacancyFiltersId: vacancy.vacancyFiltersId,
              areaId,
            })),
          );
        }
      }

      if (
        updateVacancyDto.filters?.industryIds?.length ||
        updateVacancyDto.filters?.industryIds === null
      ) {
        await tx
          .delete(vacancyFiltersIndustries)
          .where(
            eq(
              vacancyFiltersIndustries.vacancyFiltersId,
              vacancy.vacancyFiltersId,
            ),
          );
        if (updateVacancyDto.filters?.industryIds?.length) {
          await tx.insert(vacancyFiltersIndustries).values(
            updateVacancyDto.filters.industryIds.map((industryId) => ({
              vacancyFiltersId: vacancy.vacancyFiltersId,
              industryId,
            })),
          );
        }
      }

      return vacancy;
    });
    return vacancy;
  }

  /**
   * Close a Vacancy: move it to a terminal (isFinal) Vacancy Status and stamp the
   * recruiter-chosen Close Date. Unlike a status flip on the generic `update` path
   * (which stamps `now()`), this lets the date be backdated to when the search
   * actually closed. The coupling invariant (final status ⟺ Close Date present) is
   * preserved: we reject non-final statuses here. The date is not range-validated
   * by design — see CloseVacancySchema. Returns the updated row plus `closeChange`
   * (old/new date) for the audit trail.
   */
  async close(id: number, dto: CloseVacancyServiceDto) {
    const { organizationId, statusId, closedAt } = dto;
    return this.db.transaction(async (tx) => {
      const existing = await tx.query.vacancies.findFirst({
        where: and(
          eq(vacancies.id, id),
          eq(vacancies.organizationId, organizationId),
        ),
      });
      if (!existing) throw new NotFoundException('Vacancy not found');

      const status = await tx.query.vacancyStatuses.findFirst({
        where: and(
          eq(vacancyStatuses.id, statusId),
          eq(vacancyStatuses.organizationId, organizationId),
        ),
      });
      if (!status) throw new NotFoundException('Vacancy status not found');
      if (!status.isFinal) {
        throw new BadRequestException(
          'Cannot close a vacancy with a non-final status',
        );
      }

      const closeDate = this.normalizeCloseDate(closedAt);
      const [updated] = await tx
        .update(vacancies)
        .set({
          statusId,
          closedAt: closeDate,
          updatedAt: new Date(),
        } as Partial<Vacancy>)
        .where(
          and(
            eq(vacancies.id, id),
            eq(vacancies.organizationId, organizationId),
          ),
        )
        .returning();
      if (!updated) throw new NotFoundException('Vacancy not found');

      return {
        ...updated,
        closeChange: {
          from: this.toCloseDateLabel(existing.closedAt),
          to: this.toCloseDateLabel(closeDate),
        },
      };
    });
  }

  /**
   * Reopen a Vacancy: clear its Close Date and move it back to a non-final status.
   * `statusId` is optional — when omitted we fall back to the Organization's first
   * non-final status (ordered by id). Returns the updated row plus `closeChange`
   * (old date → null) for the audit trail.
   */
  async reopen(id: number, organizationId: number, statusId?: number) {
    return this.db.transaction(async (tx) => {
      const existing = await tx.query.vacancies.findFirst({
        where: and(
          eq(vacancies.id, id),
          eq(vacancies.organizationId, organizationId),
        ),
      });
      if (!existing) throw new NotFoundException('Vacancy not found');

      let targetStatus: VacancyStatus | undefined;
      if (statusId != null) {
        targetStatus = await tx.query.vacancyStatuses.findFirst({
          where: and(
            eq(vacancyStatuses.id, statusId),
            eq(vacancyStatuses.organizationId, organizationId),
          ),
        });
        if (!targetStatus) {
          throw new NotFoundException('Vacancy status not found');
        }
        if (targetStatus.isFinal) {
          throw new BadRequestException(
            'Cannot reopen a vacancy into a final status',
          );
        }
      } else {
        targetStatus = await tx.query.vacancyStatuses.findFirst({
          where: and(
            eq(vacancyStatuses.organizationId, organizationId),
            eq(vacancyStatuses.isFinal, false),
          ),
          orderBy: asc(vacancyStatuses.id),
        });
        if (!targetStatus) {
          throw new BadRequestException(
            'No open status configured to reopen this vacancy into',
          );
        }
      }

      const [updated] = await tx
        .update(vacancies)
        .set({
          statusId: targetStatus.id,
          closedAt: null,
          updatedAt: new Date(),
        } as Partial<Vacancy>)
        .where(
          and(
            eq(vacancies.id, id),
            eq(vacancies.organizationId, organizationId),
          ),
        )
        .returning();
      if (!updated) throw new NotFoundException('Vacancy not found');

      return {
        ...updated,
        closeChange: {
          from: this.toCloseDateLabel(existing.closedAt),
          to: null,
        },
      };
    });
  }

  /**
   * Pin a recruiter-supplied date (`YYYY-MM-DD` or full ISO) to 12:00 UTC on that
   * calendar day. Noon-UTC storage keeps the day stable across display timezones
   * (it never rolls over to the previous/next day for any zone in ±12h).
   */
  private normalizeCloseDate(input: string): Date {
    const datePart = input.slice(0, 10);
    const date = new Date(`${datePart}T12:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid close date');
    }
    return date;
  }

  private toCloseDateLabel(date: Date | null): string | null {
    return date ? date.toISOString().slice(0, 10) : null;
  }

  async remove(id: number, organizationId: number) {
    const [vacancy] = await this.db
      .delete(vacancies)
      .where(
        and(
          eq(vacancies.id, id),
          eq(vacancies.organizationId, organizationId),
        ),
      )
      .returning();

    if (!vacancy) throw new NotFoundException('Vacancy not found');

    await this.db
      .delete(vacancyFilters)
      .where(eq(vacancyFilters.id, vacancy.vacancyFiltersId));

    return vacancy;
  }

  /**
   * Helper methods for query building
   * These methods handle filtering, ordering, and pagination of post queries
   */

  /** `transformQueryResult` minus the candidacy graph — list aggregates instead. */
  private transformListQueryResult(
    result: VacancyListQueryResult,
    candidateStatusCounts: VacancyListItemApiResponse['candidateStatusCounts'],
    recentCandidates: VacancyListItemApiResponse['recentCandidates'],
  ): VacancyListItemApiResponse {
    const { status, filters, company, ...rest } = result;
    const { password: _createdByPassword, ...createdBy } = result.createdBy;
    const { password: _assignedToPassword, ...assignedTo } = result.assignedTo;

    return {
      ...rest,
      status,
      filters: filters
        ? {
            ...filters,
            areas: filters.areaIds?.map((a) => a.area) || [],
            industries: filters.industryIds?.map((i) => i.industry) || [],
            seniorities: filters.seniorityIds?.map((s) => s.seniority) || [],
          }
        : null,
      company,
      candidateCount: candidateStatusCounts.reduce(
        (total, status) => total + status.count,
        0,
      ),
      candidateStatusCounts,
      recentCandidates,
      createdBy,
      assignedTo,
    };
  }

  private transformQueryResult(result: VacancyQueryResult): VacancyApiResponse {
    const { status, filters, company, candidateVacancies, ...rest } = result;
    const { password: _createdByPassword, ...createdBy } = result.createdBy;
    const { password: _assignedToPassword, ...assignedTo } = result.assignedTo;

    return {
      ...rest,
      status: result.status,
      filters: filters
        ? {
            ...result.filters,
            areas: result.filters?.areaIds?.map((a) => a.area) || [],
            industries:
              result.filters?.industryIds?.map((i) => i.industry) || [],
            seniorities:
              result.filters?.seniorityIds?.map((s) => s.seniority) || [],
          }
        : null,
      company: result.company,
      candidates: result.candidateVacancies
        .map((cv) => {
          const { candidateVacancyStatus, candidate, ...rest } = cv;
          const {
            candidateAreas,
            candidateIndustries,
            candidateSeniorities,
            ...candidateRest
          } = candidate as typeof candidate & {
            candidateAreas?: Array<{ area: unknown }>;
            candidateIndustries?: Array<{ industry: unknown }>;
            candidateSeniorities?: Array<{ seniority: unknown }>;
          };
          return {
            ...rest,
            candidate: {
              ...candidateRest,
              areas:
                candidateAreas?.map((ca) => ca.area).filter(Boolean) ?? [],
              industries:
                candidateIndustries
                  ?.map((ci) => ci.industry)
                  .filter(Boolean) ?? [],
              seniorities:
                candidateSeniorities
                  ?.map((cs) => cs.seniority)
                  .filter(Boolean) ?? [],
            },
            status: candidateVacancyStatus,
          };
        })
        .filter((c) => c.candidate.deleted === false),
      createdBy: createdBy,
      assignedTo: assignedTo,
    };
  }

  private buildOrderBy(params: VacancyFindAllServiceParams): SQL[] {
    const [sortBy, sortOrderString] = params.order?.split(':') || ['id', 'asc'];
    const sortOrder = sortOrderString?.toLowerCase() === 'desc' ? desc : asc;
    // Basic safety check: ensure sortBy is a valid column key
    const column = vacancies[sortBy];
    if (column) {
      return [sortOrder(column)];
    }
    throw new BadRequestException('Invalid sortBy parameter');
  }

  private buildWhereClause(query: VacancyFindAllServiceParams) {
    const filters: SQL[] = [];
    filters.push(eq(vacancies.organizationId, query.organizationId));
    if (query.id) {
      filters.push(eq(vacancies.id, query.id));
    }
    if (query.title) {
      filters.push(ilike(vacancies.title, `%${query.title}%`));
    }
    if (query.description) {
      filters.push(ilike(vacancies.description, `%${query.description}%`));
    }

    if (query.statusId) {
      filters.push(eq(vacancies.statusId, query.statusId));
    }

    if (query.companyId) {
      filters.push(eq(vacancies.companyId, query.companyId));
    }

    if (query.filterGender) {
      const genderSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFilters)
        .innerJoin(vacancies, eq(vacancies.vacancyFiltersId, vacancyFilters.id))
        .where(ilike(vacancyFilters.gender, query.filterGender))
        .as('gender_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db.select({ id: genderSubquery.vacancyId }).from(genderSubquery),
        ),
      );
    }

    if (query.filterMinAge) {
      const minAgeSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFilters)
        .innerJoin(vacancies, eq(vacancies.vacancyFiltersId, vacancyFilters.id))
        .where(eq(vacancyFilters.minAge, query.filterMinAge))
        .as('min_age_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db.select({ id: minAgeSubquery.vacancyId }).from(minAgeSubquery),
        ),
      );
    }

    if (query.filterMaxAge) {
      const maxAgeSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFilters)
        .innerJoin(vacancies, eq(vacancies.vacancyFiltersId, vacancyFilters.id))
        .where(eq(vacancyFilters.maxAge, query.filterMaxAge))
        .as('max_age_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db.select({ id: maxAgeSubquery.vacancyId }).from(maxAgeSubquery),
        ),
      );
    }

    if (query.filterMinStars) {
      const minStarsSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFilters)
        .innerJoin(vacancies, eq(vacancies.vacancyFiltersId, vacancyFilters.id))
        .where(eq(vacancyFilters.minStars, String(query.filterMinStars)))
        .as('min_stars_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db
            .select({ id: minStarsSubquery.vacancyId })
            .from(minStarsSubquery),
        ),
      );
    }

    if (query.filterAreaIds?.length) {
      const areaSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFiltersAreas)
        .innerJoin(
          vacancies,
          eq(vacancies.vacancyFiltersId, vacancyFiltersAreas.vacancyFiltersId),
        )
        .where(inArray(vacancyFiltersAreas.areaId, query.filterAreaIds))
        .as('area_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db.select({ id: areaSubquery.vacancyId }).from(areaSubquery),
        ),
      );
    }

    if (query.filterIndustryIds?.length) {
      const industrySubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFiltersIndustries)
        .innerJoin(
          vacancies,
          eq(
            vacancies.vacancyFiltersId,
            vacancyFiltersIndustries.vacancyFiltersId,
          ),
        )
        .where(
          inArray(vacancyFiltersIndustries.industryId, query.filterIndustryIds),
        )
        .as('industry_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db
            .select({ id: industrySubquery.vacancyId })
            .from(industrySubquery),
        ),
      );
    }

    if (query.filterSeniorityIds?.length) {
      const senioritySubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFiltersSeniorities)
        .innerJoin(
          vacancies,
          eq(
            vacancies.vacancyFiltersId,
            vacancyFiltersSeniorities.vacancyFiltersId,
          ),
        )
        .where(
          inArray(
            vacancyFiltersSeniorities.seniorityId,
            query.filterSeniorityIds,
          ),
        )
        .as('seniority_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db
            .select({ id: senioritySubquery.vacancyId })
            .from(senioritySubquery),
        ),
      );
    }

    if (query.filterCountries?.length) {
      const arr = query.filterCountries;
      const sqlArray = sql`ARRAY[${sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      )}]::text[]`;
      const countriesSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFilters)
        .innerJoin(vacancies, eq(vacancies.vacancyFiltersId, vacancyFilters.id))
        .where(sql`${vacancyFilters.countries} && ${sqlArray}`)
        .as('countries_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db
            .select({ id: countriesSubquery.vacancyId })
            .from(countriesSubquery),
        ),
      );
    }

    if (query.filterProvinces?.length) {
      const arr = query.filterProvinces;
      const sqlArray = sql`ARRAY[${sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      )}]::text[]`;
      const provincesSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFilters)
        .innerJoin(vacancies, eq(vacancies.vacancyFiltersId, vacancyFilters.id))
        .where(sql`${vacancyFilters.provinces} && ${sqlArray}`)
        .as('provinces_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db
            .select({ id: provincesSubquery.vacancyId })
            .from(provincesSubquery),
        ),
      );
    }

    if (query.filterLanguages?.length) {
      const arr = query.filterLanguages;
      const sqlArray = sql`ARRAY[${sql.join(
        arr.map((v) => sql`${v}`),
        sql`, `,
      )}]::text[]`;
      const languagesSubquery = this.db
        .select({ vacancyId: vacancies.id })
        .from(vacancyFilters)
        .innerJoin(vacancies, eq(vacancies.vacancyFiltersId, vacancyFilters.id))
        .where(sql`${vacancyFilters.languages} && ${sqlArray}`)
        .as('languages_subquery');

      filters.push(
        inArray(
          vacancies.id,
          this.db
            .select({ id: languagesSubquery.vacancyId })
            .from(languagesSubquery),
        ),
      );
    }

    if (query.createdById) {
      filters.push(eq(vacancies.createdBy, query.createdById));
    }

    if (query.assignedToId) {
      filters.push(eq(vacancies.assignedTo, query.assignedToId));
    }

    if (query.search) {
      filters.push(
        or(
          ilike(vacancies.title, `%${query.search}%`),
          ilike(sql`${vacancies.id}::text`, `%${query.search}%`),
        ),
      );
    }

    return and(...filters);
  }
}
