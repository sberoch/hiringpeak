/**
 * Commercial picklists every Organization starts with. Seeded during
 * Onboarding, by the dev/prod seed scripts, and (for Organizations that
 * existed before the CRM) by migration 0008 — keep that SQL in sync.
 */
export const DEFAULT_OPPORTUNITY_STAGES: readonly {
  name: string;
  sort: number;
  isWon: boolean;
  isLost: boolean;
}[] = [
  { name: "Primer contacto", sort: 0, isWon: false, isLost: false },
  { name: "Reunión", sort: 1, isWon: false, isLost: false },
  { name: "Propuesta enviada", sort: 2, isWon: false, isLost: false },
  { name: "Negociación", sort: 3, isWon: false, isLost: false },
  { name: "Ganada", sort: 4, isWon: true, isLost: false },
  { name: "Perdida", sort: 5, isWon: false, isLost: true },
];

export const DEFAULT_LOST_REASONS: readonly { name: string; sort: number }[] = [
  { name: "Precio", sort: 0 },
  { name: "Eligió otra consultora", sort: 1 },
  { name: "Se canceló la búsqueda", sort: 2 },
  { name: "Sin respuesta", sort: 3 },
  { name: "Otro", sort: 4 },
];
