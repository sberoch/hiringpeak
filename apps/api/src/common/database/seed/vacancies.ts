/* eslint-disable */
import { and, eq } from 'drizzle-orm';
import {
  vacancies,
  vacancyFilters,
  vacancyFiltersSeniorities,
  vacancyFiltersAreas,
  vacancyFiltersIndustries,
} from '@workspace/shared/schemas';
import { SeedTx } from './types';

interface VacancySeed {
  title: string;
  description: string;
  company: string;
  status: string;
  area: string;
  industry: string;
  seniority: string;
}

const vacanciesList: VacancySeed[] = [
  {
    title: 'Gerente Comercial',
    description: 'Responsable de la estrategia comercial y desarrollo de nuevos negocios en la región.',
    company: 'Volkswagen Argentina',
    status: 'Abierta',
    area: 'Comercial',
    industry: 'Automotriz',
    seniority: 'Gerente',
  },
  {
    title: 'Director de Finanzas',
    description: 'Liderar el área financiera, reportando directamente al CEO.',
    company: 'Salentein',
    status: 'Abierta',
    area: 'Finanzas',
    industry: 'Agro Negocios',
    seniority: 'Director',
  },
  {
    title: 'Jefe de Logística',
    description: 'Gestión integral de la cadena logística y distribución nacional.',
    company: 'Corven',
    status: 'Abierta',
    area: 'Logística',
    industry: 'Industria',
    seniority: 'Jefe - Team Lider',
  },
  {
    title: 'Gerente de RRHH',
    description: 'Diseñar e implementar políticas de talento y cultura organizacional.',
    company: 'Hospital Británico',
    status: 'Abierta',
    area: 'RRHH',
    industry: 'Laboratorio - Farma',
    seniority: 'Gerente',
  },
  {
    title: 'Director de Marketing Digital',
    description: 'Liderar la transformación digital del área de marketing y ecommerce.',
    company: 'Laboratorios Elea',
    status: 'Abierta',
    area: 'Digital-Ecommerce',
    industry: 'Laboratorio - Farma',
    seniority: 'Director',
  },
  {
    title: 'Jefe de Sistemas',
    description: 'Responsable de infraestructura tecnológica y proyectos de IT.',
    company: 'Hospital Italiano',
    status: 'Abierta',
    area: 'Sistemas - Tecnología',
    industry: 'Digital',
    seniority: 'Jefe - Team Lider',
  },
  {
    title: 'Gerente de Planta',
    description: 'Gestión integral de planta productiva con foco en eficiencia y seguridad.',
    company: 'Volkswagen Argentina',
    status: 'Cancelada',
    area: 'Producción - Planta',
    industry: 'Automotriz',
    seniority: 'Gerente',
  },
  {
    title: 'Asistente Ejecutiva CEO',
    description: 'Soporte ejecutivo al CEO, gestión de agenda y coordinación de reuniones de directorio.',
    company: 'Salentein',
    status: 'Cubierta',
    area: 'Administración',
    industry: 'Agro Negocios',
    seniority: 'Asistente Ejecutiva',
  },
  {
    title: 'Gerente de Supply Chain',
    description: 'Optimización de la cadena de suministro end-to-end.',
    company: 'Corven',
    status: 'Standby',
    area: 'Supply Chain',
    industry: 'Industria',
    seniority: 'Gerente',
  },
  {
    title: 'Director Legal',
    description: 'Liderar el área legal corporativa, compliance y contratos.',
    company: 'Hospital Británico',
    status: 'Standby',
    area: 'Legales',
    industry: 'Laboratorio - Farma',
    seniority: 'Director',
  },
];

export { vacanciesList };

export async function seedVacancies(
  tx: SeedTx,
  opts: {
    organizationId: number;
    userId: number;
    vacancyStatusIds: Map<string, number>;
    companyIds: Map<string, number>;
    areaIds: Map<string, number>;
    industryIds: Map<string, number>;
    seniorityIds: Map<string, number>;
  },
) {
  console.log('Seeding vacancies...');
  const vacancyIds = new Map<string, number>();

  for (const v of vacanciesList) {
    const [existing] = await tx
      .select({ id: vacancies.id })
      .from(vacancies)
      .where(
        and(
          eq(vacancies.title, v.title),
          eq(vacancies.organizationId, opts.organizationId),
        ),
      )
      .limit(1);
    if (existing) {
      console.log(`  Vacancy "${v.title}" already exists (id=${existing.id}), skipping`);
      vacancyIds.set(v.title, existing.id);
      continue;
    }

    const statusId = opts.vacancyStatusIds.get(v.status);
    const companyId = opts.companyIds.get(v.company);
    const areaId = opts.areaIds.get(v.area);
    const industryId = opts.industryIds.get(v.industry);
    const seniorityId = opts.seniorityIds.get(v.seniority);

    if (!statusId || !companyId || !areaId || !industryId || !seniorityId) {
      throw new Error(`Missing catalog reference for vacancy "${v.title}"`);
    }

    const [vacancyFilter] = await tx
      .insert(vacancyFilters)
      .values({ organizationId: opts.organizationId })
      .returning({ id: vacancyFilters.id });
    if (!vacancyFilter) throw new Error('VacancyFilter insert failed');

    await tx.insert(vacancyFiltersSeniorities).values({
      vacancyFiltersId: vacancyFilter.id,
      seniorityId,
    });
    await tx.insert(vacancyFiltersAreas).values({
      vacancyFiltersId: vacancyFilter.id,
      areaId,
    });
    await tx.insert(vacancyFiltersIndustries).values({
      vacancyFiltersId: vacancyFilter.id,
      industryId,
    });

    const [vacancy] = await tx
      .insert(vacancies)
      .values({
        title: v.title,
        description: v.description,
        statusId,
        vacancyFiltersId: vacancyFilter.id,
        companyId,
        createdBy: opts.userId,
        assignedTo: opts.userId,
        organizationId: opts.organizationId,
      } as typeof vacancies.$inferInsert)
      .returning({ id: vacancies.id });
    if (!vacancy) throw new Error(`Vacancy insert failed for "${v.title}"`);
    console.log(`  Vacancy "${v.title}" created (id=${vacancy.id})`);
    vacancyIds.set(v.title, vacancy.id);
  }

  return { vacancyIds };
}
