import { CompanyStatusEnum, type Company } from '@workspace/shared/types/company';
import type { VacancyApiResponse } from '../vacancy/vacancy.service';
import {
  buildCompanyReportData,
  buildCompanyReportFileName,
  buildCompanyReportSummary,
  buildCompanyReportVacancyRow,
  daysBetween,
  extractHires,
  sortVacancyRows,
} from './company-report.utils';

const baseCompany: Company = {
  id: 17,
  name: 'Compañía Ágil',
  description: 'Cliente de prueba',
  status: CompanyStatusEnum.ACTIVE,
  vacancyCount: 2,
  createdAt: '2026-04-08T00:00:00.000Z',
  clientName: 'Ana Pérez',
  clientEmail: 'ana@cliente.com',
  clientPhone: '+54 11 5555-5555',
};

const generatedAt = new Date('2026-04-08T10:00:00.000Z');

describe('company-report.utils', () => {
  it('aggregates vacancy rows, summary and hires for a company', () => {
    const report = buildCompanyReportData({
      company: baseCompany,
      generatedAt,
      organizationName: 'Organización Demo',
      vacancies: [
        createVacancy({
          id: 1,
          title: 'Recruiter SSR',
          statusName: 'Abierta',
          createdAt: new Date('2026-03-09T10:00:00.000Z'),
          closedAt: null,
          salary: 'USD 3000-4000',
          candidateStatusNames: ['Postulado', 'Postulado', 'Contratado'],
        }),
        createVacancy({
          id: 2,
          title: 'People Analyst',
          statusName: 'Cubierta',
          createdAt: new Date('2026-02-08T10:00:00.000Z'),
          closedAt: new Date('2026-04-01T10:00:00.000Z'),
          candidateStatusNames: ['Contratado'],
        }),
        createVacancy({
          id: 3,
          title: 'Talent Lead',
          statusName: 'Abierta',
          createdAt: new Date('2026-04-01T10:00:00.000Z'),
          closedAt: null,
          candidateStatusNames: [],
        }),
      ],
    });

    expect(report.summary.totalVacancies).toBe(3);
    expect(report.summary.activeVacancies).toBe(2);
    expect(report.summary.closedVacancies).toBe(1);
    expect(report.summary.totalCandidates).toBe(4);
    expect(report.summary.hiredCandidates).toBe(2);
    // active vacancies daysOpen: vacancy 1 = 30, vacancy 3 = 7 → average 18.5
    expect(report.summary.averageDaysOpen).toBeCloseTo(18.5, 5);
    expect(report.hires.map((h) => h.candidateName)).toEqual([
      'Candidate 1-3',
      'Candidate 2-1',
    ]);
    expect(report.vacancies.map((v) => v.id)).toEqual([1, 3, 2]);
    expect(report.vacancies[2]?.daysOpen).toBe(52); // closed vacancy uses created→closed
    expect(report.vacancies[0]?.salary).toBe('USD 3000-4000');
    expect(report.contactInfo.clientName).toBe('Ana Pérez');
  });

  it('keeps zero values when there are no vacancies', () => {
    const report = buildCompanyReportData({
      company: baseCompany,
      generatedAt,
      organizationName: 'Organización Demo',
      vacancies: [],
    });

    expect(report.summary.totalVacancies).toBe(0);
    expect(report.summary.activeVacancies).toBe(0);
    expect(report.summary.closedVacancies).toBe(0);
    expect(report.summary.totalCandidates).toBe(0);
    expect(report.summary.hiredCandidates).toBe(0);
    expect(report.summary.averageDaysOpen).toBe(0);
    expect(report.hires).toEqual([]);
    expect(report.vacancies).toEqual([]);
  });

  it('truncates per-vacancy descriptions over 300 chars', () => {
    const long = 'a'.repeat(305);
    const row = buildCompanyReportVacancyRow(
      createVacancy({
        id: 1,
        title: 'X',
        statusName: 'Abierta',
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        closedAt: null,
        description: long,
      }),
      generatedAt,
    );
    expect(row.description?.length).toBe(301);
    expect(row.description?.endsWith('…')).toBe(true);
  });

  it('preserves short descriptions verbatim and ignores blank ones', () => {
    const row = buildCompanyReportVacancyRow(
      createVacancy({
        id: 1,
        title: 'X',
        statusName: 'Abierta',
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        closedAt: null,
        description: '   ',
      }),
      generatedAt,
    );
    expect(row.description).toBeUndefined();
  });

  it('sorts vacancies open-first by daysOpen desc, then closed by closedAt desc', () => {
    const rows = [
      buildCompanyReportVacancyRow(
        createVacancy({
          id: 10,
          title: 'Old closed',
          statusName: 'Cubierta',
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
          closedAt: new Date('2026-02-01T10:00:00.000Z'),
        }),
        generatedAt,
      ),
      buildCompanyReportVacancyRow(
        createVacancy({
          id: 11,
          title: 'Recent closed',
          statusName: 'Cubierta',
          createdAt: new Date('2026-03-01T10:00:00.000Z'),
          closedAt: new Date('2026-04-01T10:00:00.000Z'),
        }),
        generatedAt,
      ),
      buildCompanyReportVacancyRow(
        createVacancy({
          id: 12,
          title: 'New open',
          statusName: 'Abierta',
          createdAt: new Date('2026-04-05T10:00:00.000Z'),
          closedAt: null,
        }),
        generatedAt,
      ),
      buildCompanyReportVacancyRow(
        createVacancy({
          id: 13,
          title: 'Old open',
          statusName: 'Abierta',
          createdAt: new Date('2026-02-01T10:00:00.000Z'),
          closedAt: null,
        }),
        generatedAt,
      ),
    ];
    const sorted = sortVacancyRows(rows);
    expect(sorted.map((r) => r.id)).toEqual([13, 12, 11, 10]);
  });

  it('extractHires returns alphabetically sorted hire/vacancy pairs', () => {
    const hires = extractHires([
      createVacancy({
        id: 1,
        title: 'Vacancy A',
        statusName: 'Abierta',
        createdAt: generatedAt,
        closedAt: null,
        candidateStatusNames: ['Contratado', 'Postulado'],
      }),
      createVacancy({
        id: 2,
        title: 'Vacancy B',
        statusName: 'Abierta',
        createdAt: generatedAt,
        closedAt: null,
        candidateStatusNames: ['Contratado'],
      }),
    ]);
    expect(hires).toEqual([
      { candidateName: 'Candidate 1-1', vacancyTitle: 'Vacancy A' },
      { candidateName: 'Candidate 2-1', vacancyTitle: 'Vacancy B' },
    ]);
  });

  it('summary averageDaysOpen ignores closed vacancies and is 0 with no actives', () => {
    const closedOnly = buildCompanyReportSummary([
      buildCompanyReportVacancyRow(
        createVacancy({
          id: 1,
          title: 'X',
          statusName: 'Cubierta',
          createdAt: new Date('2026-01-01T10:00:00.000Z'),
          closedAt: new Date('2026-02-01T10:00:00.000Z'),
        }),
        generatedAt,
      ),
    ]);
    expect(closedOnly.averageDaysOpen).toBe(0);
    expect(closedOnly.activeVacancies).toBe(0);
    expect(closedOnly.closedVacancies).toBe(1);
  });

  it('builds a deterministic filename slug', () => {
    const fileName = buildCompanyReportFileName(
      'Compañía Ágil / LATAM',
      generatedAt,
    );
    expect(fileName).toBe('reporte-empresa-compania-agil-latam-2026-04-08.pdf');
  });

  it('computes days between two dates', () => {
    expect(
      daysBetween(
        new Date('2026-04-01T10:00:00.000Z'),
        new Date('2026-04-08T10:00:00.000Z'),
      ),
    ).toBe(7);
  });
});

function createVacancy(params: {
  id: number;
  title: string;
  statusName: string;
  createdAt: Date;
  closedAt: Date | null;
  candidateStatusNames?: string[];
  description?: string;
  salary?: string;
}): VacancyApiResponse {
  const statusNames = params.candidateStatusNames ?? [];
  return {
    id: params.id,
    title: params.title,
    description: params.description ?? '',
    salary: params.salary ?? null,
    closedAt: params.closedAt,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    vacancyFiltersId: null,
    statusId: 1,
    companyId: baseCompany.id,
    organizationId: 1,
    status: {
      id: params.id,
      name: params.statusName,
      sort: 1,
      isFinal: false,
      organizationId: 1,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
    },
    filters: null,
    company: baseCompany,
    candidates: statusNames.map((statusName, index) => ({
      id: index + 1,
      candidateId: index + 1,
      vacancyId: params.id,
      organizationId: 1,
      candidateVacancyStatusId: index + 1,
      notes: null,
      rejectionReason: null,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
      candidate: {
        id: index + 1,
        name: `Candidate ${params.id}-${index + 1}`,
        email: `candidate${index + 1}@mail.com`,
        sourceId: null,
        organizationId: 1,
        gender: 'none',
        deleted: false,
        image: null,
        dateOfBirth: null,
        shortDescription: null,
        linkedin: null,
        address: null,
        phone: null,
        stars: null,
        isInCompanyViaPratt: false,
        countries: [],
        provinces: [],
        languages: [],
        createdAt: params.createdAt,
        updatedAt: params.createdAt,
        source: null,
      },
      status: {
        id: index + 1,
        name: statusName,
        sort: index,
        isInitial: index === 0,
        isRejection: false,
        organizationId: 1,
        createdAt: params.createdAt,
        updatedAt: params.createdAt,
      },
    })),
    createdBy: {
      id: 1,
      name: 'Owner',
      email: 'owner@mail.com',
      roleId: 1,
      active: true,
      createdAt: params.createdAt,
      lastLogin: params.createdAt,
      userType: 'END_USER',
      organizationId: 1,
    },
    assignedTo: {
      id: 2,
      name: 'Recruiter',
      email: 'recruiter@mail.com',
      roleId: 1,
      active: true,
      createdAt: params.createdAt,
      lastLogin: params.createdAt,
      userType: 'END_USER',
      organizationId: 1,
    },
  } as unknown as VacancyApiResponse;
}
