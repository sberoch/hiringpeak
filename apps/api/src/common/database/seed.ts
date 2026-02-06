/**
 * Dev seed: inserts at least one row per schema entity so the app can be used end-to-end.
 * Assumes an empty DB (e.g. run after db:reset). Do not run against a DB that already has data
 * you want to keep, or make it idempotent (e.g. skip if rows exist) before using on shared DBs.
 */
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { UserRole, CompanyStatus } from '@workspace/shared/enums';
import {
  hashPassword,
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
} from '@workspace/shared/schemas';
import { CreateCandidateSchema } from '@workspace/shared/dtos';

config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const db = drizzle(process.env.DATABASE_URL!);
  const hashedPassword = await hashPassword('12345678');

  // --- Tier 1: no FKs ---
  const [user] = await db
    .insert(users)
    .values({
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Admin',
      role: UserRole.ADMIN,
      active: true,
    } as typeof users.$inferInsert)
    .returning({ id: users.id });
  console.log('user', user);
  if (!user) throw new Error('User insert failed');
  const userId = user.id;

  const [area] = await db
    .insert(areas)
    .values({ name: 'Engineering' })
    .returning({ id: areas.id });
  const [industry] = await db
    .insert(industries)
    .values({ name: 'Technology' })
    .returning({ id: industries.id });
  const [seniority] = await db
    .insert(seniorities)
    .values({ name: 'Mid' })
    .returning({ id: seniorities.id });
  const [vacancyStatus] = await db
    .insert(vacancyStatuses)
    .values({ name: 'Open' })
    .returning({ id: vacancyStatuses.id });
  const [candidateVacancyStatus] = await db
    .insert(candidateVacancyStatuses)
    .values({ name: 'Applied', sort: 1, isInitial: true })
    .returning({ id: candidateVacancyStatuses.id });
  const [candidateSource] = await db
    .insert(candidateSources)
    .values({ name: 'LinkedIn' })
    .returning({ id: candidateSources.id });
  const [candidateFile] = await db
    .insert(candidateFiles)
    .values({ name: 'resume.pdf', url: 'https://example.com/resume.pdf' })
    .returning({ id: candidateFiles.id });

  if (
    !area ||
    !industry ||
    !seniority ||
    !vacancyStatus ||
    !candidateVacancyStatus ||
    !candidateSource ||
    !candidateFile
  ) {
    throw new Error('Tier 1 insert failed');
  }

  // --- Tier 2 ---
  const [company] = await db
    .insert(companies)
    .values({
      name: 'Acme Corp',
      description: 'A dev-friendly company',
      status: CompanyStatus.ACTIVE,
    })
    .returning({ id: companies.id });
  const [vacancyFilter] = await db
    .insert(vacancyFilters)
    .values({})
    .returning({ id: vacancyFilters.id });

  if (!company || !vacancyFilter) throw new Error('Tier 2 insert failed');

  // --- Tier 3: vacancyFilters junctions ---
  await db.insert(vacancyFiltersSeniorities).values({
    vacancyFiltersId: vacancyFilter.id,
    seniorityId: seniority.id,
  });
  await db.insert(vacancyFiltersAreas).values({
    vacancyFiltersId: vacancyFilter.id,
    areaId: area.id,
  });
  await db.insert(vacancyFiltersIndustries).values({
    vacancyFiltersId: vacancyFilter.id,
    industryId: industry.id,
  });

  // --- Tier 4 ---
  const [vacancy] = await db
    .insert(vacancies)
    .values({
      title: 'Senior Engineer',
      description: 'Full-time role for a senior engineer.',
      statusId: vacancyStatus.id,
      vacancyFiltersId: vacancyFilter.id,
      companyId: company.id,
      createdBy: userId,
      assignedTo: userId,
    } as typeof vacancies.$inferInsert)
    .returning({ id: vacancies.id });

  const [candidate] = await db
    .insert(candidates)
    .values(
      CreateCandidateSchema.parse({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        sourceId: candidateSource.id,
        seniorityIds: [seniority.id],
        areaIds: [area.id],
        industryIds: [industry.id],
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
      }),
    )
    .returning({ id: candidates.id });

  if (!vacancy || !candidate) throw new Error('Tier 4 insert failed');

  // --- Tier 5: candidate junctions ---
  await db.insert(candidateAreas).values({
    candidateId: candidate.id,
    areaId: area.id,
  });
  await db.insert(candidateIndustries).values({
    candidateId: candidate.id,
    industryId: industry.id,
  });
  await db.insert(candidateSeniorities).values({
    candidateId: candidate.id,
    seniorityId: seniority.id,
  });
  await db.insert(candidateFilesRelation).values({
    candidateId: candidate.id,
    fileId: candidateFile.id,
  });

  // --- Tier 6 ---
  await db.insert(comments).values({
    candidateId: candidate.id,
    userId,
    comment: 'Strong profile, recommend for interview.',
  });
  await db.insert(blacklists).values({
    candidateId: candidate.id,
    userId,
    reason: 'Dev seed: sample blacklist entry (can delete).',
  });
  await db.insert(candidateVacancies).values({
    candidateId: candidate.id,
    vacancyId: vacancy.id,
    candidateVacancyStatusId: candidateVacancyStatus.id,
    notes: 'Dev seed application.',
  } as typeof candidateVacancies.$inferInsert);

  console.log('Database seeded successfully.');
}

main().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
