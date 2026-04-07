/* eslint-disable */
import { and, eq } from 'drizzle-orm';
import {
  candidates,
  candidateVacancies,
} from '@workspace/shared/schemas';
import { SeedTx } from './types';

/**
 * Maps vacancy title -> array of { candidateName, status }.
 * Varied frequencies: some vacancies get many candidates, some few, some none.
 * ~30 total assignments across 20 candidates; some candidates appear in multiple vacancies.
 */
const assignments: {
  vacancy: string;
  candidates: { name: string; status: string }[];
}[] = [
  {
    // 7 candidates — the busiest vacancy
    vacancy: 'Gerente Comercial',
    candidates: [
      { name: 'Martín Álvarez', status: 'Entrevista cliente 1' },
      { name: 'Nicolás García', status: 'Entrevista Pratt' },
      { name: 'Agustín Morales', status: 'En revisión' },
      { name: 'Gonzalo Méndez', status: 'En revisión' },
      { name: 'Carolina Gutiérrez', status: 'No es el perfil' },
      { name: 'Matías Sánchez', status: 'En revisión' },
      { name: 'Rocío Navarro', status: 'Entrevista Pratt' },
    ],
  },
  {
    // 6 candidates
    vacancy: 'Director de Finanzas',
    candidates: [
      { name: 'Lucía Fernández', status: 'Entrevista cliente 2' },
      { name: 'Ignacio Herrera', status: 'Oferta' },
      { name: 'Santiago Rodríguez', status: 'Entrevista Pratt' },
      { name: 'Tomás Peralta', status: 'En revisión' },
      { name: 'Julieta Díaz', status: 'No es el perfil' },
      { name: 'María Paz Vega', status: 'En revisión' },
    ],
  },
  {
    // 4 candidates
    vacancy: 'Jefe de Logística',
    candidates: [
      { name: 'Nicolás García', status: 'Entrevista cliente 1' },
      { name: 'Gonzalo Méndez', status: 'Entrevista Pratt' },
      { name: 'Martín Álvarez', status: 'No es el perfil' },
      { name: 'Matías Sánchez', status: 'En revisión' },
    ],
  },
  {
    // 3 candidates
    vacancy: 'Gerente de RRHH',
    candidates: [
      { name: 'Sofía Romero', status: 'Contratado' },
      { name: 'Carolina Gutiérrez', status: 'Entrevista cliente 1' },
      { name: 'Daniela Castro', status: 'Entrevista Pratt' },
    ],
  },
  {
    // 3 candidates
    vacancy: 'Director de Marketing Digital',
    candidates: [
      { name: 'Valentina López', status: 'Entrevista cliente 2' },
      { name: 'Rocío Navarro', status: 'Entrevista Pratt' },
      { name: 'Facundo Torres', status: 'En revisión' },
    ],
  },
  {
    // 3 candidates
    vacancy: 'Jefe de Sistemas',
    candidates: [
      { name: 'Facundo Torres', status: 'Oferta' },
      { name: 'Federico Ruiz', status: 'Entrevista cliente 1' },
      { name: 'Santiago Rodríguez', status: 'Entrevista Pratt' },
    ],
  },
  {
    // 2 candidates — cancelled vacancy, still has history
    vacancy: 'Gerente de Planta',
    candidates: [
      { name: 'Agustín Morales', status: 'Entrevista Pratt' },
      { name: 'Matías Sánchez', status: 'No es el perfil' },
    ],
  },
  {
    // 1 candidate — filled vacancy
    vacancy: 'Asistente Ejecutiva CEO',
    candidates: [
      { name: 'Florencia Acosta', status: 'Contratado' },
    ],
  },
  // 'Gerente de Supply Chain' — 0 candidates (standby, no applicants yet)
  // 'Director Legal' — 0 candidates (standby, no applicants yet)
];

export async function seedCandidateVacancies(
  tx: SeedTx,
  opts: {
    organizationId: number;
    vacancyIds: Map<string, number>;
    candidateVacancyStatusIds: Map<string, number>;
  },
) {
  console.log('Seeding candidate-vacancy assignments...');

  // Build a name->id lookup for candidates in this org
  const allCandidates = await tx
    .select({ id: candidates.id, name: candidates.name })
    .from(candidates)
    .where(eq(candidates.organizationId, opts.organizationId));
  const candidateIdByName = new Map(allCandidates.map((c) => [c.name, c.id]));

  let created = 0;
  let skipped = 0;

  for (const { vacancy, candidates: assignedCandidates } of assignments) {
    const vacancyId = opts.vacancyIds.get(vacancy);
    if (!vacancyId) {
      console.log(`  Vacancy "${vacancy}" not found, skipping assignments`);
      continue;
    }

    for (const { name, status } of assignedCandidates) {
      const candidateId = candidateIdByName.get(name);
      const statusId = opts.candidateVacancyStatusIds.get(status);
      if (!candidateId || !statusId) {
        console.log(`  Missing reference: candidate="${name}" or status="${status}", skipping`);
        continue;
      }

      // Check if assignment already exists
      const [existing] = await tx
        .select({ id: candidateVacancies.id })
        .from(candidateVacancies)
        .where(
          and(
            eq(candidateVacancies.candidateId, candidateId),
            eq(candidateVacancies.vacancyId, vacancyId),
          ),
        )
        .limit(1);
      if (existing) {
        skipped++;
        continue;
      }

      await tx.insert(candidateVacancies).values({
        organizationId: opts.organizationId,
        candidateId,
        vacancyId,
        candidateVacancyStatusId: statusId,
      } as typeof candidateVacancies.$inferInsert);
      created++;
    }
  }

  console.log(`  Candidate-vacancy assignments: ${created} created, ${skipped} already existed`);
}
