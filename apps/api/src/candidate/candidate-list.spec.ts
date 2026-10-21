import { describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';

async function setup() {
  const db = await createTestDatabase();
  const { candidates } = await testServices(db);
  const f = fixtures(db);
  const org = await f.organization();
  return { candidates, f, org };
}

describe('Listing Candidates', () => {
  it('returns the contact details, Candidate Source, countries, languages and created date of each Candidate', async () => {
    const { candidates, f, org } = await setup();
    const sourceId = await f.candidateSource(org, 'Referido');
    await f.candidate(org, 'Ana', {
      email: 'ana@example.com',
      phone: '+54 11 5555 0000',
      linkedin: 'https://linkedin.com/in/ana',
      sourceId,
      countries: ['Argentina', 'Uruguay'],
      languages: ['Inglés'],
      createdAt: new Date('2026-03-04T10:00:00Z'),
    });

    const { items } = await candidates.findAll({ organizationId: org });

    expect(items[0]).toMatchObject({
      email: 'ana@example.com',
      phone: '+54 11 5555 0000',
      linkedin: 'https://linkedin.com/in/ana',
      source: { id: sourceId, name: 'Referido' },
      countries: ['Argentina', 'Uruguay'],
      languages: ['Inglés'],
      createdAt: new Date('2026-03-04T10:00:00Z'),
    });
  });
});
