import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

type JournalEntry = {
  idx: number;
  tag: string;
  when: number;
};

type Journal = {
  entries: JournalEntry[];
};

function migrationMeta(migrationsFolder: string, entry: JournalEntry) {
  const filePath = path.join(migrationsFolder, `${entry.tag}.sql`);
  const sql = fs.readFileSync(filePath, 'utf8');
  const hash = crypto.createHash('sha256').update(sql).digest('hex');
  return { hash, createdAt: entry.when, tag: entry.tag };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const migrationsFolder = path.resolve(__dirname, '../../../drizzle');
  const journalPath = path.join(migrationsFolder, 'meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as Journal;

  const pool = new Pool({ connectionString });
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS drizzle');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const schemaCheck = await pool.query<{
      organizations: string | null;
      tasks: string | null;
    }>(`
      SELECT
        to_regclass('public.organizations') AS organizations,
        to_regclass('public.tasks') AS tasks
    `);
    const hasExistingSchema = Boolean(schemaCheck.rows[0]?.organizations);
    if (!hasExistingSchema) {
      console.log('Fresh database — no baseline needed.');
      return;
    }

    if (!schemaCheck.rows[0]?.tasks) {
      console.log(
        'Legacy schema detected (organizations without tasks) — 0000 will be baselined; run pending migrations for tasks.',
      );
    }

    const applied = await pool.query<{
      hash: string;
      created_at: string;
    }>('SELECT hash, created_at FROM drizzle.__drizzle_migrations');
    const appliedHashes = new Set(applied.rows.map((row) => row.hash));
    let maxAppliedAt = applied.rows.reduce(
      (max, row) => Math.max(max, Number(row.created_at)),
      0,
    );

    for (const entry of journal.entries) {
      const meta = migrationMeta(migrationsFolder, entry);
      if (appliedHashes.has(meta.hash)) {
        console.log(`  ${meta.tag} already recorded — skip`);
        continue;
      }

      const isInitialSchemaMigration = entry.idx === 0;

      if (isInitialSchemaMigration && hasExistingSchema && maxAppliedAt < meta.createdAt) {
        await pool.query(
          'INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)',
          [meta.hash, meta.createdAt],
        );
        console.log(`  Baslined ${meta.tag} (created_at=${meta.createdAt})`);
        appliedHashes.add(meta.hash);
        maxAppliedAt = Math.max(maxAppliedAt, meta.createdAt);
        continue;
      }

      console.log(`  ${meta.tag} pending — will run via db:migrate`);
    }
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    console.log('Baseline complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Baseline failed:', err);
    process.exit(1);
  });
