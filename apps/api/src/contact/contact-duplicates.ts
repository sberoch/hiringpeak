/**
 * Probable duplicates of a Contact being created: same email, same LinkedIn
 * or same name, ignoring case and accents. A warning only — duplicates are
 * never blocked (PRD: no uniqueness constraint on Contacts).
 *
 * Pure: no I/O, no throw.
 */

export type DuplicateReason = 'email' | 'linkedin' | 'name';

export type DuplicateProbe = {
  name?: string | null;
  email?: string | null;
  linkedin?: string | null;
};

type Comparable = {
  name: string;
  email: string | null;
  linkedin: string | null;
};

/** Names this short ("Ana") match too many people to be worth a warning. */
const MIN_NAME_LENGTH = 4;

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeLinkedin(value: string | null | undefined): string {
  return normalize(value)
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

export function findLikelyDuplicates<T extends Comparable>(
  probe: DuplicateProbe,
  existing: readonly T[],
): { contact: T; reason: DuplicateReason }[] {
  const email = normalize(probe.email);
  const linkedin = normalizeLinkedin(probe.linkedin);
  const name = normalize(probe.name);
  const matches: { contact: T; reason: DuplicateReason }[] = [];

  for (const contact of existing) {
    if (email && normalize(contact.email) === email) {
      matches.push({ contact, reason: 'email' });
    } else if (linkedin && normalizeLinkedin(contact.linkedin) === linkedin) {
      matches.push({ contact, reason: 'linkedin' });
    } else if (
      name.length >= MIN_NAME_LENGTH &&
      normalize(contact.name) === name
    ) {
      matches.push({ contact, reason: 'name' });
    }
  }
  return matches;
}
