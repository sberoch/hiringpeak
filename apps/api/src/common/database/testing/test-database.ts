import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@workspace/shared/schemas';
import type { DrizzleDatabase } from '../types/drizzle';

/**
 * An in-memory Postgres (PGlite) with every migration applied: the database
 * boundary for service specs. Services run against it unchanged, so a spec
 * writes through one public method and reads back through another.
 *
 * Migrations run once per spec file; each call returns a fresh, empty clone.
 */
let migrated: Promise<PGlite> | undefined;

function migratedTemplate(): Promise<PGlite> {
  migrated ??= (async () => {
    const client = new PGlite();
    await migrate(drizzle(client, { schema }), {
      migrationsFolder: join(__dirname, '../../../../drizzle'),
    });
    return client;
  })();
  return migrated;
}

export async function createTestDatabase(): Promise<DrizzleDatabase> {
  const client = await (await migratedTemplate()).clone();
  return drizzle(client as PGlite, {
    schema,
  }) as unknown as DrizzleDatabase;
}
