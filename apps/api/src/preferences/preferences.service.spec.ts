import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { PreferencesService } from './preferences.service';

let preferences: PreferencesService;
let f: ReturnType<typeof fixtures>;
let org: number;
let lucia: number;

const compact = [
  { key: 'name', visible: true },
  { key: 'stars', visible: true },
  { key: 'industries', visible: false },
  { key: 'actions', visible: true },
];

beforeEach(async () => {
  const db = await createTestDatabase();
  ({ preferences } = await testServices(db));
  f = fixtures(db);
  org = await f.organization();
  lucia = await f.user(org, [], 'Lucía');
});

describe('PreferencesService', () => {
  it('reads back a saved layout', async () => {
    await preferences.saveLayout(lucia, 'candidates', compact);

    expect(await preferences.findLayouts(lucia)).toEqual({
      candidates: compact,
    });
  });

  it('overwrites a layout saved again under the same key', async () => {
    const wide = compact.map((entry) => ({ ...entry, visible: true }));
    await preferences.saveLayout(lucia, 'candidates', compact);
    await preferences.saveLayout(lucia, 'candidates', wide);

    expect(await preferences.findLayouts(lucia)).toEqual({ candidates: wide });
  });

  it('returns to no saved layout once the layout is deleted', async () => {
    await preferences.saveLayout(lucia, 'candidates', compact);
    await preferences.saveLayout(lucia, 'dashboard.rail', compact);

    await preferences.removeLayout(lucia, 'candidates');

    expect(await preferences.findLayouts(lucia)).toEqual({
      'dashboard.rail': compact,
    });
  });

  it("never shows or touches another User's layouts", async () => {
    const tomas = await f.user(org, [], 'Tomás');
    await preferences.saveLayout(lucia, 'candidates', compact);
    await preferences.saveLayout(tomas, 'contacts', compact);
    await preferences.removeLayout(tomas, 'candidates');

    expect(await preferences.findLayouts(lucia)).toEqual({
      candidates: compact,
    });
  });

  it('rejects an unknown layout key', async () => {
    await expect(
      preferences.saveLayout(lucia, 'vacancies', compact),
    ).rejects.toThrow(BadRequestException);
  });

  it.each([
    ['not a list', { name: true }],
    ['an entry without a visible flag', [{ key: 'name' }]],
    ['an entry with an empty key', [{ key: '', visible: true }]],
    [
      'a repeated key',
      [
        { key: 'name', visible: true },
        { key: 'name', visible: false },
      ],
    ],
  ])('rejects a malformed layout: %s', async (_, value) => {
    await expect(
      preferences.saveLayout(lucia, 'candidates', value),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts entry keys no catalogue knows', async () => {
    const future = [...compact, { key: 'hologram', visible: true }];
    await preferences.saveLayout(lucia, 'candidates', future);

    expect(await preferences.findLayouts(lucia)).toEqual({
      candidates: future,
    });
  });
});
