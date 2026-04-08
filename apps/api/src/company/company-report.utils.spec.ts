import type { Company } from '@workspace/shared/types/company';
import type { VacancyApiResponse } from '../vacancy/vacancy.service';
import {
  buildCompanyReportData,
  buildCompanyReportFileName,
  isCancelledCandidateStatus,
} from './company-report.utils';

const baseCompany: Company = {
  id: 17,
  name: 'Compañía Ágil',
  description: 'Cliente de prueba',
  status: 'Active',
  vacancyCount: 2,
  createdAt: '2026-04-08T00:00:00.000Z',
};

describe('company-report.utils', () => {
  it('counts only exact cancelled status names and calculates totals', () => {
    const report = buildCompanyReportData({
      company: {
        ...baseCompany,
        clientName: 'Ana Pérez',
      },
      generatedAt: new Date('2026-04-08T10:00:00.000Z'),
      organizationName: 'Organización Demo',
      vacancies: [
        createVacancy({
          id: 1,
          statusName: 'Abierta',
          title: 'Recruiter SSR',
          candidateStatusNames: ['Cancelada', 'En revisión', 'Cancelled'],
        }),
        createVacancy({
          id: 2,
          statusName: 'Cubierta',
          title: 'People Analyst',
          candidateStatusNames: ['En revisión'],
        }),
      ],
    });

    expect(report.summary.totalVacancies).toBe(2);
    expect(report.summary.totalPeople).toBe(4);
    expect(report.summary.totalCancelledPeople).toBe(2);
    expect(report.summary.averagePeoplePerVacancy).toBe(2);
    expect(report.summary.globalCancellationRate).toBe(50);
    expect(report.summary.totalEstimatedAmount).toBe(2000);
    expect(report.vacancies[0]?.cancelledCount).toBe(2);
    expect(report.vacancies[0]?.cancellationRate).toBeCloseTo(66.6667, 3);
  });

  it('keeps zero values when there are no vacancies', () => {
    const report = buildCompanyReportData({
      company: baseCompany,
      generatedAt: new Date('2026-04-08T10:00:00.000Z'),
      organizationName: 'Organización Demo',
      vacancies: [],
    });

    expect(report.summary.totalVacancies).toBe(0);
    expect(report.summary.totalPeople).toBe(0);
    expect(report.summary.totalCancelledPeople).toBe(0);
    expect(report.summary.averagePeoplePerVacancy).toBe(0);
    expect(report.summary.globalCancellationRate).toBe(0);
    expect(report.summary.totalEstimatedAmount).toBe(0);
    expect(report.vacancies).toEqual([]);
  });

  it('builds a deterministic filename slug', () => {
    const fileName = buildCompanyReportFileName(
      'Compañía Ágil / LATAM',
      new Date('2026-04-08T10:00:00.000Z'),
    );

    expect(fileName).toBe('reporte-empresa-compania-agil-latam-2026-04-08.pdf');
  });

  it('detects cancelled statuses with exact names only', () => {
    expect(isCancelledCandidateStatus('Cancelada')).toBe(true);
    expect(isCancelledCandidateStatus('Cancelled')).toBe(true);
    expect(isCancelledCandidateStatus('cancelada')).toBe(false);
    expect(isCancelledCandidateStatus('En revisión')).toBe(false);
  });
});

function createVacancy(params: {
  candidateStatusNames: string[];
  id: number;
  statusName: string;
  title: string;
}): VacancyApiResponse {
  return {
    id: params.id,
    title: params.title,
    description: '',
    status: {
      id: params.id,
      name: params.statusName,
      color: '#0066ff',
      sort: 1,
      organizationId: 1,
      createdAt: new Date('2026-04-08T10:00:00.000Z'),
      updatedAt: new Date('2026-04-08T10:00:00.000Z'),
    },
    filters: null,
    company: baseCompany,
    candidates: params.candidateStatusNames.map((statusName, index) => ({
      id: index + 1,
      candidateId: index + 1,
      vacancyId: params.id,
      organizationId: 1,
      notes: '',
      createdAt: new Date('2026-04-08T10:00:00.000Z'),
      updatedAt: new Date('2026-04-08T10:00:00.000Z'),
      candidate: {
        id: index + 1,
        name: `Candidate ${index + 1}`,
        email: `candidate${index + 1}@mail.com`,
        phone: '',
        location: '',
        linkedin: '',
        portfolio: '',
        salary: '',
        currentJobTitle: '',
        experience: '',
        education: '',
        stars: 0,
        salaryExpectation: '',
        isAvailable: true,
        isInCompanyViaPratt: false,
        deleted: false,
        organizationId: 1,
        gender: 'none',
        age: 30,
        sourceId: null,
        createdAt: '2026-04-08T10:00:00.000Z',
        updatedAt: '2026-04-08T10:00:00.000Z',
      },
      status: {
        id: index + 1,
        name: statusName,
        sort: index + 1,
        isInitial: index === 0,
      },
    })),
    createdAt: '2026-04-08T10:00:00.000Z',
    updatedAt: '2026-04-08T10:00:00.000Z',
    createdBy: {
      id: 1,
      name: 'Owner',
      email: 'owner@mail.com',
      roleId: 1,
      active: true,
      createdAt: '2026-04-08T10:00:00.000Z',
      lastLogin: '2026-04-08T10:00:00.000Z',
      userType: 'END_USER',
      organizationId: 1,
    },
    assignedTo: {
      id: 2,
      name: 'Recruiter',
      email: 'recruiter@mail.com',
      roleId: 1,
      active: true,
      createdAt: '2026-04-08T10:00:00.000Z',
      lastLogin: '2026-04-08T10:00:00.000Z',
      userType: 'END_USER',
      organizationId: 1,
    },
  };
}
