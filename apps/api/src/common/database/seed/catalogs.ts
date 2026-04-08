/* eslint-disable */
import { and, eq } from 'drizzle-orm';

import {
  areas,
  industries,
  seniorities,
  vacancyStatuses,
  candidateVacancyStatuses,
  candidateSources,
  candidateFiles,
} from '@workspace/shared/schemas';
import { SeedTx } from './types';

const areasList = [
  'Administración',
  'Administración y Finanzas',
  'Comercial',
  'Compras',
  'Digital-Ecommerce',
  'Finanzas',
  'Legales',
  'Logística',
  'Marketing',
  'Mantenimiento',
  'Producción - Planta',
  'Project Management',
  'RRHH',
  'RRPP-RRII',
  'Seguridad',
  'Sistemas - Tecnología',
  'Supply Chain',
  'Sustentabilidad',
];
const industriesList = [
  'Automotriz',
  'Agro Negocios',
  'Banca',
  'Capital Markets',
  'Consumo Masivo',
  'Digital',
  'Energía',
  'Hotelería-Turismo',
  'Industria',
  'Laboratorio - Farma',
  'Logistica',
  'Minería',
  'Oil & Gas',
  'ONG',
  'Publicidad',
  'Retail - SMK',
];
const senioritiesList = [
  'CEO',
  'Director',
  'Gerente',
  'Jefe - Team Lider',
  'Asistente Ejecutiva',
];
const vacancyStatusesList: { name: string; isFinal: boolean }[] = [
  { name: 'Abierta', isFinal: false },
  { name: 'Cancelada', isFinal: true },
  { name: 'Cubierta', isFinal: true },
  { name: 'Standby', isFinal: false },
];
const candidateVacancyStatusesList: {
  name: string;
  sort: number;
  isInitial: boolean;
}[] = [
  { name: 'No es el perfil', sort: 0, isInitial: false },
  { name: 'En revisión', sort: 1, isInitial: true },
  { name: 'Entrevista Pratt', sort: 2, isInitial: false },
  { name: 'Entrevista cliente 1', sort: 3, isInitial: false },
  { name: 'Entrevista cliente 2', sort: 4, isInitial: false },
  { name: 'Oferta', sort: 5, isInitial: false },
  { name: 'Contratado', sort: 6, isInitial: false },
];
const candidateSourcesList = ['LinkedIn', 'Interna', 'Referencia'];

async function findOrCreateByName(
  tx: SeedTx,
  table: any,
  name: string,
  organizationId: number,
  extra?: Record<string, any>,
) {
  const [found] = await tx
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.name, name), eq(table.organizationId, organizationId)))
    .limit(1);
  if (found) {
    console.log(`  ${name} already exists (id=${found.id}), skipping`);
    return found.id as number;
  }

  const [row] = await tx
    .insert(table)
    .values({ name, organizationId, ...extra })
    .returning({ id: table.id });
  if (!row) throw new Error(`Insert failed for ${name}`);
  console.log(`  ${name} created (id=${row.id})`);
  return row.id as number;
}

async function seedList(
  tx: SeedTx,
  table: any,
  names: string[],
  organizationId: number,
  label: string,
) {
  console.log(`  Seeding ${label}...`);
  const ids = new Map<string, number>();
  for (const name of names) {
    const id = await findOrCreateByName(tx, table, name, organizationId);
    ids.set(name, id);
  }
  return ids;
}

export async function seedCatalogs(tx: SeedTx, organizationId: number) {
  console.log('Seeding catalogs...');

  const areaIds = await seedList(tx, areas, areasList, organizationId, 'areas');
  const industryIds = await seedList(tx, industries, industriesList, organizationId, 'industries');
  const seniorityIds = await seedList(tx, seniorities, senioritiesList, organizationId, 'seniorities');
  // Vacancy statuses with isFinal flag
  console.log('  Seeding vacancy statuses...');
  const vacancyStatusIds = new Map<string, number>();
  for (const { name, isFinal } of vacancyStatusesList) {
    const id = await findOrCreateByName(
      tx,
      vacancyStatuses,
      name,
      organizationId,
      { isFinal },
    );
    vacancyStatusIds.set(name, id);
  }

  // Candidate vacancy statuses with extra fields
  console.log('  Seeding candidate vacancy statuses...');
  const candidateVacancyStatusIds = new Map<string, number>();
  for (const { name, sort, isInitial } of candidateVacancyStatusesList) {
    const id = await findOrCreateByName(
      tx,
      candidateVacancyStatuses,
      name,
      organizationId,
      { sort, isInitial },
    );
    candidateVacancyStatusIds.set(name, id);
  }
  const initialCandidateVacancyStatusId = candidateVacancyStatusIds.get('En revisión')!;

  const candidateSourceIds = await seedList(tx, candidateSources, candidateSourcesList, organizationId, 'candidate sources');

  // candidateFiles: match by name + org
  const [existingFile] = await tx
    .select({ id: candidateFiles.id })
    .from(candidateFiles)
    .where(
      and(
        eq(candidateFiles.name, 'resume.pdf'),
        eq(candidateFiles.organizationId, organizationId),
      ),
    )
    .limit(1);
  let candidateFileId: number;
  if (existingFile) {
    console.log(
      `  resume.pdf already exists (id=${existingFile.id}), skipping`,
    );
    candidateFileId = existingFile.id;
  } else {
    const [row] = await tx
      .insert(candidateFiles)
      .values({
        name: 'resume.pdf',
        url: 'https://example.com/resume.pdf',
        organizationId,
      })
      .returning({ id: candidateFiles.id });
    if (!row) throw new Error('CandidateFile insert failed');
    console.log(`  resume.pdf created (id=${row.id})`);
    candidateFileId = row.id;
  }

  return {
    areaIds,
    industryIds,
    seniorityIds,
    vacancyStatusIds,
    candidateVacancyStatusIds,
    initialCandidateVacancyStatusId,
    candidateSourceIds,
    candidateFileId,
  };
}
