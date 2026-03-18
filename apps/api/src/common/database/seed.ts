/* eslint-disable */
/**
 * Dev seed: inserts at least one row per schema entity so the app can be used end-to-end.
 * Assumes an empty DB (e.g. run after db:reset). Do not run against a DB that already has data
 * you want to keep, or make it idempotent (e.g. skip if rows exist) before using on shared DBs.
 *
 * Run via: pnpm run db:seed (tsx src/common/database/seed.ts)
 * Standalone script: uses Drizzle + pg directly (no Nest) so it always completes.
 */
import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '@workspace/shared/schemas';
import {
  UserType,
  CompanyStatus,
  PermissionCode,
  CandidateVacancyState,
} from '@workspace/shared/enums';
import {
  hashPassword,
  organizations,
  users,
  areas,
  industries,
  seniorities,
  vacancyStatuses,
  candidateVacancyStatuses,
  candidateSources,
  candidateFiles,
  companies,
  vacancyFilters,
  vacancyFiltersSeniorities,
  vacancyFiltersAreas,
  vacancyFiltersIndustries,
  vacancies,
  candidates,
  candidateAreas,
  candidateIndustries,
  candidateSeniorities,
  candidateFilesRelation,
  comments,
  blacklists,
  candidateVacancies,
  permissions,
  roles,
  rolePermissions,
} from '@workspace/shared/schemas';
import { CreateCandidateSchema } from '@workspace/shared/dtos';

config();

// Permission seed data (must match PermissionService + include all codes used by roles)
const PERMISSION_SEED: { code: string; label: string; description: string }[] =
  [
    {
      code: PermissionCode.CANDIDATE_READ,
      label: 'Ver postulantes',
      description: 'Permite ver listado y detalle de postulantes',
    },
    {
      code: PermissionCode.CANDIDATE_MANAGE,
      label: 'Gestionar postulantes',
      description: 'Crear, editar y eliminar postulantes',
    },
    {
      code: PermissionCode.VACANCY_READ,
      label: 'Ver vacantes',
      description: 'Permite ver listado y detalle de vacantes',
    },
    {
      code: PermissionCode.VACANCY_MANAGE,
      label: 'Gestionar vacantes',
      description: 'Crear, editar y eliminar vacantes',
    },
    {
      code: PermissionCode.USER_READ,
      label: 'Ver usuarios',
      description: 'Ver usuarios de la organización',
    },
    {
      code: PermissionCode.USER_MANAGE,
      label: 'Gestionar usuarios',
      description: 'Crear y editar usuarios',
    },
    {
      code: PermissionCode.ROLE_MANAGE,
      label: 'Gestionar roles',
      description: 'Crear y asignar roles y permisos',
    },
    {
      code: PermissionCode.COMPANY_READ,
      label: 'Ver empresas',
      description: 'Ver empresas',
    },
    {
      code: PermissionCode.COMPANY_MANAGE,
      label: 'Gestionar empresas',
      description: 'Crear y editar empresas',
    },
    {
      code: PermissionCode.AREA_READ,
      label: 'Ver áreas',
      description: 'Ver áreas',
    },
    {
      code: PermissionCode.AREA_MANAGE,
      label: 'Gestionar áreas',
      description: 'Crear y editar áreas',
    },
    {
      code: PermissionCode.SETTINGS_READ,
      label: 'Ver configuración',
      description: 'Ver configuración de la organización',
    },
    {
      code: PermissionCode.SETTINGS_MANAGE,
      label: 'Gestionar configuración',
      description: 'Modificar configuración',
    },
    {
      code: PermissionCode.AUDIT_LOG_READ,
      label: 'Ver auditoría',
      description: 'Ver registro de auditoría',
    },
  ];

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

function getPermissionIds(
  codeToId: Map<string, number>,
  codes: string[],
): number[] {
  return codes
    .map((c) => codeToId.get(c))
    .filter((id): id is number => id != null);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const hashedPassword = await hashPassword('12345678');

  await db.transaction(async (tx) => {
    // --- Organization (required for multitenancy) ---
    const [org] = await tx
      .insert(organizations)
      .values({ name: 'Seed Organization' })
      .returning({ id: organizations.id });
    if (!org) throw new Error('Organization insert failed');
    const organizationId = org.id;

    // --- Seed permissions (idempotent) and create default roles for org ---
    const permissionIdsByCode = new Map<string, number>();
    for (const { code, label, description } of PERMISSION_SEED) {
      const existing = await tx.query.permissions.findFirst({
        where: eq(permissions.code, code),
        columns: { id: true },
      });
      if (existing) {
        permissionIdsByCode.set(code, existing.id);
        continue;
      }
      const [row] = await tx
        .insert(permissions)
        .values({ code, label, description } as typeof permissions.$inferInsert)
        .returning({ id: permissions.id });
      if (row) permissionIdsByCode.set(code, row.id);
    }

    const [adminRole] = await tx
      .insert(roles)
      .values({
        name: 'Administrador',
        organizationId,
      } as typeof roles.$inferInsert)
      .returning({ id: roles.id });
    if (!adminRole) throw new Error('Failed to create Administrador role');
    await tx
      .insert(rolePermissions)
      .values(
        getPermissionIds(permissionIdsByCode, ALL_PERMISSION_CODES).map(
          (permissionId) => ({ roleId: adminRole.id, permissionId }),
        ),
      );

    const [managerRole] = await tx
      .insert(roles)
      .values({ name: 'Manager', organizationId } as typeof roles.$inferInsert)
      .returning({ id: roles.id });
    if (!managerRole) throw new Error('Failed to create Manager role');
    await tx.insert(rolePermissions).values(
      getPermissionIds(permissionIdsByCode, MANAGER_CODES).map(
        (permissionId) => ({
          roleId: managerRole.id,
          permissionId,
        }),
      ),
    );

    const [basicRole] = await tx
      .insert(roles)
      .values({ name: 'Basic', organizationId } as typeof roles.$inferInsert)
      .returning({ id: roles.id });
    if (!basicRole) throw new Error('Failed to create Basic role');
    await tx.insert(rolePermissions).values(
      getPermissionIds(permissionIdsByCode, READ_ONLY_CODES).map(
        (permissionId) => ({
          roleId: basicRole.id,
          permissionId,
        }),
      ),
    );

    const administradorRoleId = adminRole.id;

    // --- Tier 1: users with roleId and userType ---
    const [user] = await tx
      .insert(users)
      .values({
        email: 'admin@gmail.com',
        password: hashedPassword,
        name: 'Admin',
        active: true,
        organizationId,
        roleId: administradorRoleId,
        userType: UserType.END_USER,
      } as typeof users.$inferInsert)
      .returning({ id: users.id });
    if (!user) throw new Error('User insert failed');
    const userId = user.id;

    // System admin for backoffice (no organization)
    const [sysAdmin] = await tx
      .insert(users)
      .values({
        email: 'sysadmin@example.com',
        password: hashedPassword,
        name: 'System Admin',
        active: true,
        organizationId: null,
        userType: UserType.INTERNAL_USER,
      } as typeof users.$inferInsert)
      .returning({ id: users.id });
    if (!sysAdmin) throw new Error('System admin user insert failed');

    const [area] = await tx
      .insert(areas)
      .values({ name: 'Engineering', organizationId })
      .returning({ id: areas.id });
    const [industry] = await tx
      .insert(industries)
      .values({ name: 'Technology', organizationId })
      .returning({ id: industries.id });
    const [seniority] = await tx
      .insert(seniorities)
      .values({ name: 'Mid', organizationId })
      .returning({ id: seniorities.id });
    const [vacancyStatus] = await tx
      .insert(vacancyStatuses)
      .values({ name: 'Open', organizationId })
      .returning({ id: vacancyStatuses.id });
    const [appliedCandidateVacancyStatus] = await tx
      .insert(candidateVacancyStatuses)
      .values({
        name: CandidateVacancyState.APLICADO,
        sort: 1,
        isInitial: true,
        organizationId,
      })
      .returning({ id: candidateVacancyStatuses.id });
    await tx.insert(candidateVacancyStatuses).values({
      name: CandidateVacancyState.RECHAZADO,
      sort: 2,
      isInitial: false,
      organizationId,
    });
    const [candidateSource] = await tx
      .insert(candidateSources)
      .values({ name: 'LinkedIn', organizationId })
      .returning({ id: candidateSources.id });
    const [candidateFile] = await tx
      .insert(candidateFiles)
      .values({
        name: 'resume.pdf',
        url: 'https://example.com/resume.pdf',
        organizationId,
      })
      .returning({ id: candidateFiles.id });

    if (
      !area ||
      !industry ||
      !seniority ||
      !vacancyStatus ||
      !appliedCandidateVacancyStatus ||
      !candidateSource ||
      !candidateFile
    ) {
      throw new Error('Tier 1 insert failed');
    }

    // --- Tier 2 ---
    const [company] = await tx
      .insert(companies)
      .values({
        name: 'Acme Corp',
        description: 'A dev-friendly company',
        status: CompanyStatus.ACTIVE,
        organizationId,
      })
      .returning({ id: companies.id });
    const [vacancyFilter] = await tx
      .insert(vacancyFilters)
      .values({ organizationId })
      .returning({ id: vacancyFilters.id });

    if (!company || !vacancyFilter) throw new Error('Tier 2 insert failed');

    // --- Tier 3: vacancyFilters junctions ---
    await tx.insert(vacancyFiltersSeniorities).values({
      vacancyFiltersId: vacancyFilter.id,
      seniorityId: seniority.id,
    });
    await tx.insert(vacancyFiltersAreas).values({
      vacancyFiltersId: vacancyFilter.id,
      areaId: area.id,
    });
    await tx.insert(vacancyFiltersIndustries).values({
      vacancyFiltersId: vacancyFilter.id,
      industryId: industry.id,
    });

    // --- Tier 4 ---
    const [vacancy] = await tx
      .insert(vacancies)
      .values({
        title: 'Senior Engineer',
        description: 'Full-time role for a senior engineer.',
        statusId: vacancyStatus.id,
        vacancyFiltersId: vacancyFilter.id,
        companyId: company.id,
        createdBy: userId,
        assignedTo: userId,
        organizationId,
      } as typeof vacancies.$inferInsert)
      .returning({ id: vacancies.id });

    const candidateDto = CreateCandidateSchema.parse({
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      sourceId: candidateSource.id,
      seniorityIds: [seniority.id],
      areaIds: [area.id],
      industryIds: [industry.id],
      fileIds: [candidateFile.id],
      stars: 0,
      isInCompanyViaPratt: false,
      countries: [],
      provinces: [],
      languages: [],
      gender: 'male',
      dateOfBirth: '1990-01-01',
    });
    const {
      seniorityIds: _si,
      areaIds: _ai,
      industryIds: _ii,
      fileIds: _fi,
      ...candidateRow
    } = candidateDto;
    const [candidate] = await tx
      .insert(candidates)
      .values({
        ...candidateRow,
        dateOfBirth: candidateRow.dateOfBirth
          ? new Date(candidateRow.dateOfBirth)
          : undefined,
        organizationId,
      } as typeof candidates.$inferInsert)
      .returning({ id: candidates.id });

    if (!vacancy || !candidate) throw new Error('Tier 4 insert failed');

    // --- Tier 5: candidate junctions ---
    await tx.insert(candidateAreas).values({
      candidateId: candidate.id,
      areaId: area.id,
    });
    await tx.insert(candidateIndustries).values({
      candidateId: candidate.id,
      industryId: industry.id,
    });
    await tx.insert(candidateSeniorities).values({
      candidateId: candidate.id,
      seniorityId: seniority.id,
    });
    await tx.insert(candidateFilesRelation).values({
      candidateId: candidate.id,
      fileId: candidateFile.id,
    });

    // --- Tier 6 ---
    await tx.insert(comments).values({
      organizationId,
      candidateId: candidate.id,
      userId,
      comment: 'Strong profile, recommend for interview.',
    });
    await tx.insert(blacklists).values({
      organizationId,
      candidateId: candidate.id,
      userId,
      reason: 'Dev seed: sample blacklist entry (can delete).',
    });
    await tx.insert(candidateVacancies).values({
      organizationId,
      candidateId: candidate.id,
      vacancyId: vacancy.id,
      candidateVacancyStatusId: appliedCandidateVacancyStatus.id,
      notes: 'Dev seed application.',
    } as typeof candidateVacancies.$inferInsert);
  });

  console.log('Database seeded successfully.');
  await pool.end();
}

main().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
