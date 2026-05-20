/**
 * THROWAWAY PROTOTYPE — Tareas + Notificaciones interaction-design exploration.
 * In-memory mock data only. No API, no persistence. Delete with the rest of
 * the `tareas-prototype` folder once a direction is chosen.
 *
 * Domain reference: CONTEXT.md ("Task", "Task Owner", "Notification").
 * - Task: optional day-granular due date, binary open/done, attached to AT MOST
 *   ONE of Candidate/Vacancy/Candidacy/Company (or standalone).
 * - "overdue" is DERIVED (dueDate < today && !done), never stored.
 * - "Mis tareas" = filter assignedTo == me, NOT a privacy wall.
 */

/** Deterministic "today" so buckets are stable while flipping variants. */
export const TODAY = new Date(2026, 4, 19); // 2026-05-19 (matches session date)

export type EntityType =
  | "candidate"
  | "vacancy"
  | "candidacy"
  | "company"
  | "none";

export interface OrgUser {
  id: string;
  name: string;
  isMe?: boolean;
}

export interface AttachEntity {
  id: string;
  type: Exclude<EntityType, "none">;
  label: string;
  /** Secondary line shown in pickers / context cards. */
  sub?: string;
}

export interface Task {
  id: string;
  title: string;
  /** YYYY-MM-DD or null (backlog item — never produces a Notification). */
  dueDate: string | null;
  done: boolean;
  ownerId: string;
  createdById: string;
  attach: AttachEntity | null;
  notes?: string;
}

export type NotificationKind = "assigned" | "due" | "overdue";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  taskTitle: string;
  /** Only set for "assigned": who assigned it to you. */
  byUser?: string;
  read: boolean;
  /** Minutes ago, for relative formatting. */
  agoMinutes: number;
}

export const USERS: OrgUser[] = [
  { id: "u1", name: "María González", isMe: true },
  { id: "u2", name: "Diego Fernández" },
  { id: "u3", name: "Lucía Romero" },
  { id: "u4", name: "Tomás Acosta" },
];

export const ME = USERS.find((u) => u.isMe)!;

export const ENTITIES: AttachEntity[] = [
  { id: "c1", type: "candidate", label: "Carla Méndez", sub: "Directora Financiera · ★ 4.5" },
  { id: "c2", type: "candidate", label: "Javier Soto", sub: "Ingeniero de Software · ★ 3.0" },
  { id: "v1", type: "vacancy", label: "Director Financiero", sub: "Grupo Aldama" },
  { id: "v2", type: "vacancy", label: "Head of Engineering", sub: "Nuvox SA" },
  { id: "co1", type: "company", label: "Grupo Aldama", sub: "Cliente activo" },
  { id: "co2", type: "company", label: "Nuvox SA", sub: "Prospecto" },
  { id: "cv1", type: "candidacy", label: "Carla Méndez → Director Financiero", sub: "Etapa: Entrevista" },
];

const e = (id: string) => ENTITIES.find((x) => x.id === id)!;

export const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    title: "Llamar a Carla para coordinar entrevista",
    dueDate: "2026-05-15",
    done: false,
    ownerId: "u1",
    createdById: "u1",
    attach: e("c1"),
    notes: "Confirmar disponibilidad para la semana del 25.",
  },
  {
    id: "t2",
    title: "Enviar shortlist a Grupo Aldama",
    dueDate: "2026-05-19",
    done: false,
    ownerId: "u1",
    createdById: "u1",
    attach: e("co1"),
  },
  {
    id: "t3",
    title: "Revisar feedback de Nuvox sobre los perfiles",
    dueDate: "2026-05-21",
    done: false,
    ownerId: "u1",
    createdById: "u3",
    attach: e("v2"),
  },
  {
    id: "t4",
    title: "Preparar informe trimestral de búsquedas",
    dueDate: null,
    done: false,
    ownerId: "u1",
    createdById: "u1",
    attach: null,
  },
  {
    id: "t5",
    title: "Actualizar CV de Javier con la última experiencia",
    dueDate: "2026-05-12",
    done: false,
    ownerId: "u2",
    createdById: "u1",
    attach: e("c2"),
  },
  {
    id: "t6",
    title: "Coordinar segunda ronda de entrevistas",
    dueDate: "2026-05-19",
    done: false,
    ownerId: "u3",
    createdById: "u1",
    attach: e("cv1"),
  },
  {
    id: "t7",
    title: "Pedir referencias laborales de Carla",
    dueDate: "2026-05-26",
    done: false,
    ownerId: "u1",
    createdById: "u1",
    attach: e("c1"),
  },
  {
    id: "t8",
    title: "Cerrar búsqueda Director Financiero",
    dueDate: "2026-05-20",
    done: false,
    ownerId: "u2",
    createdById: "u2",
    attach: e("v1"),
  },
  {
    id: "t9",
    title: "Enviar propuesta comercial a Nuvox",
    dueDate: "2026-05-08",
    done: false,
    ownerId: "u4",
    createdById: "u4",
    attach: e("co2"),
  },
  {
    id: "t10",
    title: "Llamar a referente de mercado fintech",
    dueDate: "2026-05-10",
    done: true,
    ownerId: "u1",
    createdById: "u1",
    attach: null,
  },
  {
    id: "t11",
    title: "Agendar reunión de kickoff con el cliente",
    dueDate: null,
    done: false,
    ownerId: "u3",
    createdById: "u1",
    attach: e("co1"),
  },
  {
    id: "t12",
    title: "Validar disponibilidad de Carla para viajar",
    dueDate: "2026-05-19",
    done: false,
    ownerId: "u1",
    createdById: "u2",
    attach: e("c1"),
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: "n1", kind: "assigned", taskTitle: "Revisar contrato de Nuvox", byUser: "Diego Fernández", read: false, agoMinutes: 120 },
  { id: "n2", kind: "overdue", taskTitle: "Llamar a Carla para coordinar entrevista", read: false, agoMinutes: 60 },
  { id: "n3", kind: "due", taskTitle: "Enviar shortlist a Grupo Aldama", read: false, agoMinutes: 300 },
  { id: "n4", kind: "assigned", taskTitle: "Coordinar segunda ronda de entrevistas", byUser: "Lucía Romero", read: true, agoMinutes: 1500 },
  { id: "n5", kind: "due", taskTitle: "Validar disponibilidad de Carla para viajar", read: true, agoMinutes: 320 },
  { id: "n6", kind: "overdue", taskTitle: "Pedir referencias laborales de Carla", read: true, agoMinutes: 4320 },
  { id: "n7", kind: "assigned", taskTitle: "Revisar perfil de Javier", byUser: "Tomás Acosta", read: false, agoMinutes: 300 },
];

// ── Derived helpers ──────────────────────────────────────────────────────────

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function parseDue(d: string | null): Date | null {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y!, m! - 1, day!);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** DERIVED, never stored: past due date and not done. */
export function isOverdue(t: Task): boolean {
  const due = parseDue(t.dueDate);
  if (!due || t.done) return false;
  return startOfDay(due).getTime() < startOfDay(TODAY).getTime();
}

export function daysFromToday(d: string | null): number | null {
  const due = parseDue(d);
  if (!due) return null;
  const ms = startOfDay(due).getTime() - startOfDay(TODAY).getTime();
  return Math.round(ms / 86400000);
}

export type DueBucket = "overdue" | "today" | "week" | "later" | "none";

export function dueBucket(t: Task): DueBucket {
  if (!t.dueDate) return "none";
  if (isOverdue(t)) return "overdue";
  const days = daysFromToday(t.dueDate)!;
  if (days <= 0) return "today";
  if (days <= 7) return "week";
  return "later";
}

export const BUCKET_LABEL: Record<DueBucket, string> = {
  overdue: "Vencidas",
  today: "Vence hoy",
  week: "Esta semana",
  later: "Más adelante",
  none: "Sin fecha",
};

/** Human Spanish due label for a task row. */
export function formatDue(t: Task): string {
  if (!t.dueDate) return "Sin fecha";
  const days = daysFromToday(t.dueDate)!;
  if (isOverdue(t)) {
    const overdueBy = -days;
    return overdueBy === 1 ? "Venció ayer" : `Vencida hace ${overdueBy} días`;
  }
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  const due = parseDue(t.dueDate)!;
  return `${due.getDate()} ${MONTHS[due.getMonth()]}`;
}

export function shortDate(d: string | null): string {
  const due = parseDue(d);
  if (!due) return "—";
  return `${due.getDate()} ${MONTHS[due.getMonth()]}`;
}

export function relativeTime(agoMinutes: number): string {
  if (agoMinutes < 60) return `hace ${agoMinutes} min`;
  const h = Math.round(agoMinutes / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export function userName(id: string): string {
  return USERS.find((u) => u.id === id)?.name ?? "—";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export const ENTITY_TYPE_LABEL: Record<Exclude<EntityType, "none">, string> = {
  candidate: "Postulante",
  vacancy: "Vacante",
  candidacy: "Candidatura",
  company: "Empresa",
};

export const NOTIF_LABEL: Record<NotificationKind, string> = {
  assigned: "Te asignaron una tarea",
  due: "Una tarea vence hoy",
  overdue: "Una tarea está vencida",
};
