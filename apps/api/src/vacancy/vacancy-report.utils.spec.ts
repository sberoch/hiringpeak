import type { VacancyApiResponse } from './vacancy.service';
import {
  buildVacancyReportData,
  buildVacancyReportFileName,
  isHiredCandidateStatus,
  isNoProfileCandidateStatus,
} from './vacancy-report.utils';

describe('vacancy-report.utils', () => {
  it('keeps only exact status names for contratado and no es el perfil', () => {
    expect(isHiredCandidateStatus('Contratado')).toBe(true);
    expect(isHiredCandidateStatus('contratado')).toBe(false);
    expect(isNoProfileCandidateStatus('No es el perfil')).toBe(true);
    expect(isNoProfileCandidateStatus('No Es El Perfil')).toBe(false);
  });

  it('builds ordered candidate data and shows rejection reason only for no es el perfil', () => {
    const report = buildVacancyReportData({
      generatedAt: new Date('2026-04-08T10:00:00.000Z'),
      organizationName: 'Organización Demo',
      vacancy: createVacancy({
        candidates: [
          {
            id: 3,
            name: 'Zoe',
            rejectionReason: 'Sin experiencia en industria',
            sourceName: 'LinkedIn',
            stars: '3',
            statusName: 'No es el perfil',
            statusSort: 0,
          },
          {
            id: 2,
            name: 'Ana',
            sourceName: 'Referencia',
            stars: '4.5',
            statusName: 'Contratado',
            statusSort: 6,
          },
          {
            id: 1,
            name: 'Bruno',
            rejectionReason: 'No debería verse',
            sourceName: 'Interna',
            stars: '5',
            statusName: 'Entrevista Pratt',
            statusSort: 2,
          },
        ],
      }),
    });

    expect(report.summary.totalCandidates).toBe(3);
    expect(report.summary.hiredCandidates).toBe(1);
    expect(report.summary.noProfileCandidates).toBe(1);
    expect(report.hiredCandidates.map((candidate) => candidate.name)).toEqual([
      'Ana',
    ]);
    expect(report.candidates.map((candidate) => candidate.name)).toEqual([
      'Zoe',
      'Bruno',
      'Ana',
    ]);
    expect(report.candidates[0]?.rejectionReason).toBe(
      'Sin experiencia en industria',
    );
    expect(report.candidates[1]?.rejectionReason).toBeUndefined();
    expect(report.metadata.compensation).toBeUndefined();
    expect(report.profile.gender).toBe('Masculino');
  });

  it('builds a deterministic filename slug', () => {
    const fileName = buildVacancyReportFileName(
      'Dirección Comercial / LATAM',
      new Date('2026-04-08T10:00:00.000Z'),
    );

    expect(fileName).toBe(
      'reporte-vacante-direccion-comercial-latam-2026-04-08.pdf',
    );
  });
});

function createVacancy(params: {
  candidates: Array<{
    id: number;
    name: string;
    rejectionReason?: string;
    sourceName?: string;
    stars?: string;
    statusName: string;
    statusSort: number;
  }>;
}): VacancyApiResponse {
  return {
    id: 10,
    title: 'Dirección Comercial',
    description: 'Seguimiento de pipeline comercial y liderazgo regional.',
    salary: null,
    closedAt: null,
    createdAt: new Date('2026-04-01T10:00:00.000Z'),
    updatedAt: new Date('2026-04-07T10:00:00.000Z'),
    vacancyFiltersId: 20,
    statusId: 3,
    companyId: 4,
    createdBy: {
      id: 7,
      name: 'Owner',
      email: 'owner@mail.com',
      roleId: 1,
      active: true,
      createdAt: new Date('2026-04-01T10:00:00.000Z'),
      lastLogin: new Date('2026-04-08T09:00:00.000Z'),
      userType: 'END_USER',
      organizationId: 1,
    },
    assignedTo: {
      id: 8,
      name: 'Recruiter',
      email: 'recruiter@mail.com',
      roleId: 1,
      active: true,
      createdAt: new Date('2026-04-01T10:00:00.000Z'),
      lastLogin: new Date('2026-04-08T09:00:00.000Z'),
      userType: 'END_USER',
      organizationId: 1,
    },
    organizationId: 1,
    status: {
      id: 3,
      name: 'Abierta',
      isFinal: false,
      organizationId: 1,
      createdAt: new Date('2026-04-01T10:00:00.000Z'),
      updatedAt: new Date('2026-04-01T10:00:00.000Z'),
    },
    filters: {
      id: 20,
      organizationId: 1,
      minStars: 3,
      gender: 'male',
      minAge: 30,
      maxAge: 45,
      countries: ['Argentina'],
      provinces: ['Buenos Aires'],
      languages: ['Inglés'],
      areas: [{ id: 1, name: 'Comercial', organizationId: 1 }],
      industries: [{ id: 2, name: 'Retail', organizationId: 1 }],
      seniorities: [{ id: 3, name: 'Director', organizationId: 1 }],
    },
    company: {
      id: 4,
      name: 'Compañía Demo',
      description: 'Cliente',
      status: 'Active',
      vacancyCount: 1,
      createdAt: '2026-04-01T10:00:00.000Z',
    },
    candidates: params.candidates.map((candidate) => ({
      id: candidate.id,
      candidateId: candidate.id,
      vacancyId: 10,
      organizationId: 1,
      candidateVacancyStatusId: candidate.id,
      notes: null,
      rejectionReason: candidate.rejectionReason ?? null,
      createdAt: new Date('2026-04-01T10:00:00.000Z'),
      updatedAt: new Date('2026-04-01T10:00:00.000Z'),
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: `${candidate.name.toLowerCase()}@mail.com`,
        sourceId: candidate.id,
        organizationId: 1,
        gender: 'none',
        deleted: false,
        image: null,
        dateOfBirth: null,
        shortDescription: null,
        linkedin: null,
        address: null,
        phone: null,
        stars: candidate.stars ?? null,
        isInCompanyViaPratt: false,
        countries: [],
        provinces: [],
        languages: [],
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        updatedAt: new Date('2026-04-01T10:00:00.000Z'),
        source: candidate.sourceName
          ? {
              id: candidate.id,
              name: candidate.sourceName,
              organizationId: 1,
              createdAt: new Date('2026-04-01T10:00:00.000Z'),
              updatedAt: new Date('2026-04-01T10:00:00.000Z'),
            }
          : null,
      },
      status: {
        id: candidate.id,
        name: candidate.statusName,
        sort: candidate.statusSort,
        isInitial: false,
        isRejection: candidate.statusName === 'No es el perfil',
        organizationId: 1,
        createdAt: new Date('2026-04-01T10:00:00.000Z'),
        updatedAt: new Date('2026-04-01T10:00:00.000Z'),
      },
    })),
  } as unknown as VacancyApiResponse;
}
