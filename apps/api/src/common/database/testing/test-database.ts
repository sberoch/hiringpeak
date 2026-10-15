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
 * Migrations run once per spec file; each call empties every table (ids
 * restart at 1) and hands the database back, so tests in a file don't share
 * data.
 */
let migrated: Promise<{ client: PGlite; tables: string }> | undefined;

function migratedDatabase() {
  migrated ??= (async () => {
    const client = new PGlite();
    await migrate(drizzle(client, { schema }), {
      migrationsFolder: join(__dirname, '../../../../drizzle'),
    });
    const { rows } = await client.query<{ name: string }>(
      `select quote_ident(tablename) as name from pg_tables where schemaname = 'public'`,
    );
    return { client, tables: rows.map((row) => row.name).join(', ') };
  })();
  return migrated;
}

/** Tables given a failing insert trigger by `failInsertsInto`. */
const failing = new Set<string>();

export async function createTestDatabase(): Promise<DrizzleDatabase> {
  const { client, tables } = await migratedDatabase();
  for (const table of failing) {
    await client.exec(`drop trigger test_fail_insert on ${table}`);
  }
  failing.clear();
  await client.exec(`truncate ${tables} restart identity cascade`);
  return drizzle(client, { schema }) as unknown as DrizzleDatabase;
}

/**
 * Fault injection at the database: every insert into `table` fails until the
 * next `createTestDatabase`. For checking that a write is all-or-nothing.
 */
export async function failInsertsInto(table: string): Promise<void> {
  const { client } = await migratedDatabase();
  await client.exec(`
    create or replace function test_fail_insert() returns trigger
      language plpgsql as $$ begin raise exception 'db down'; end $$;
    create trigger test_fail_insert before insert on ${table}
      for each row execute function test_fail_insert();
  `);
  failing.add(table);
}
