import { beforeEach, describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { ContactSourceService } from './contactsource.service';

/** Contact Sources keep a gap-free order through adds, moves and deletes. */
let sources: ContactSourceService;
let org: number;

beforeEach(async () => {
  const db = await createTestDatabase();
  sources = (await testServices(db)).contactSources;
  org = await fixtures(db).organization();
  for (const name of ['Evento', 'Referido', 'LinkedIn']) {
    await sources.create({ name, organizationId: org });
  }
});

const listed = async () =>
  (await sources.findAll({ organizationId: org, order: 'sort:asc' })).items.map(
    (s) => [s.name, s.sort],
  );

const idOf = async (name: string) =>
  (await sources.findAll({ organizationId: org })).items.find(
    (s) => s.name === name,
  )!.id;

describe('ContactSourceService ordering', () => {
  it('adds a source last by default', async () => {
    expect(await listed()).toEqual([
      ['Evento', 0],
      ['Referido', 1],
      ['LinkedIn', 2],
    ]);
  });

  it('adds a source at the given position', async () => {
    await sources.create({ name: 'Web', sort: 1, organizationId: org });
    expect(await listed()).toEqual([
      ['Evento', 0],
      ['Web', 1],
      ['Referido', 2],
      ['LinkedIn', 3],
    ]);
  });

  it('moves a source', async () => {
    await sources.update(await idOf('LinkedIn'), {
      sort: 0,
      organizationId: org,
    });
    expect(await listed()).toEqual([
      ['LinkedIn', 0],
      ['Evento', 1],
      ['Referido', 2],
    ]);
  });

  it('closes the gap when a source is deleted', async () => {
    await sources.remove(await idOf('Evento'), org);
    expect(await listed()).toEqual([
      ['Referido', 0],
      ['LinkedIn', 1],
    ]);
  });
});
