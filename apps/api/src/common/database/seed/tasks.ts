
import { and, eq } from 'drizzle-orm';
import { candidates, tasks } from '@workspace/shared/schemas';
import { SeedTx } from './types';

/**
 * A spread of tasks across the three attachable targets (candidate, vacancy,
 * company) plus standalone tasks. Mixes completed/pending and dated/backlog
 * items so the board, lists and "due soon" surfaces all have data.
 * Targets are referenced by name and resolved to ids at insert time; a task
 * whose target can't be resolved is skipped.
 */
type SeedTask = {
  title: string;
  dueDate: string | null;
  completed?: boolean;
  candidate?: string;
  vacancy?: string;
  company?: string;
};

const taskList: SeedTask[] = [
  // --- Attached to candidates ---
  {
    title: 'Llamar para coordinar entrevista',
    dueDate: '2026-06-10',
    candidate: 'Martín Álvarez',
  },
  {
    title: 'Pedir referencias laborales',
    dueDate: '2026-06-12',
    candidate: 'Lucía Fernández',
  },
  {
    title: 'Enviar feedback de la entrevista',
    dueDate: '2026-05-28',
    completed: true,
    candidate: 'Ignacio Herrera',
  },
  {
    title: 'Revisar CV actualizado',
    dueDate: null,
    candidate: 'Nicolás García',
  },

  // --- Attached to vacancies ---
  {
    title: 'Armar terna para el cliente',
    dueDate: '2026-06-11',
    vacancy: 'Gerente Comercial',
  },
  {
    title: 'Actualizar descripción del puesto',
    dueDate: '2026-06-15',
    vacancy: 'Director de Finanzas',
  },
  {
    title: 'Publicar aviso en portales',
    dueDate: '2026-05-30',
    completed: true,
    vacancy: 'Jefe de Sistemas',
  },
  {
    title: 'Definir rango salarial con el cliente',
    dueDate: null,
    vacancy: 'Director Legal',
  },

  // --- Attached to companies ---
  {
    title: 'Reunión de seguimiento mensual',
    dueDate: '2026-06-18',
    company: 'Volkswagen Argentina',
  },
  {
    title: 'Enviar propuesta comercial',
    dueDate: '2026-06-09',
    company: 'Salentein',
  },
  {
    title: 'Firmar renovación de contrato',
    dueDate: '2026-05-20',
    completed: true,
    company: 'Hospital Británico',
  },

  // --- Standalone (no target) ---
  {
    title: 'Preparar reporte semanal de búsquedas',
    dueDate: '2026-06-09',
  },
  {
    title: 'Depurar base de candidatos inactivos',
    dueDate: null,
  },
  {
    title: 'Capacitación interna del equipo',
    dueDate: '2026-05-22',
    completed: true,
  },
];

export async function seedTasks(
  tx: SeedTx,
  opts: {
    organizationId: number;
    userId: number;
    vacancyIds: Map<string, number>;
    companyIds: Map<string, number>;
  },
) {
  console.log('Seeding tasks...');

  // Build a name->id lookup for candidates in this org
  const allCandidates = await tx
    .select({ id: candidates.id, name: candidates.name })
    .from(candidates)
    .where(eq(candidates.organizationId, opts.organizationId));
  const candidateIdByName = new Map(allCandidates.map((c) => [c.name, c.id]));

  let created = 0;
  let skipped = 0;

  for (const task of taskList) {
    // Resolve the optional target reference, if any
    let candidateId: number | null = null;
    let vacancyId: number | null = null;
    let companyId: number | null = null;

    if (task.candidate) {
      candidateId = candidateIdByName.get(task.candidate) ?? null;
      if (!candidateId) {
        console.log(`  Candidate "${task.candidate}" not found, skipping task "${task.title}"`);
        continue;
      }
    }
    if (task.vacancy) {
      vacancyId = opts.vacancyIds.get(task.vacancy) ?? null;
      if (!vacancyId) {
        console.log(`  Vacancy "${task.vacancy}" not found, skipping task "${task.title}"`);
        continue;
      }
    }
    if (task.company) {
      companyId = opts.companyIds.get(task.company) ?? null;
      if (!companyId) {
        console.log(`  Company "${task.company}" not found, skipping task "${task.title}"`);
        continue;
      }
    }

    // Check if task already exists (by title within the org)
    const [existing] = await tx
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(
          eq(tasks.title, task.title),
          eq(tasks.organizationId, opts.organizationId),
        ),
      )
      .limit(1);
    if (existing) {
      skipped++;
      continue;
    }

    await tx.insert(tasks).values({
      title: task.title,
      dueDate: task.dueDate,
      completed: task.completed ?? false,
      completedAt: task.completed ? new Date('2026-06-01') : null,
      completedBy: task.completed ? opts.userId : null,
      createdBy: opts.userId,
      assignedTo: opts.userId,
      organizationId: opts.organizationId,
      candidateId,
      vacancyId,
      companyId,
    } as typeof tasks.$inferInsert);
    created++;
  }

  console.log(`  Tasks: ${created} created, ${skipped} already existed`);
}
