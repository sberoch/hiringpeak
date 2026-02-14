/* eslint-disable */
/**
 * Dev seed: inserts at least one row per schema entity so the app can be used end-to-end.
 * Assumes an empty DB (e.g. run after db:reset). Do not run against a DB that already has data
 * you want to keep, or make it idempotent (e.g. skip if rows exist) before using on shared DBs.
 *
 * Run via: pnpm run seed (or node dist/common/database/seed.js after build)
 * Uses Nest application context and SeedService (RoleService + PermissionService for RBAC).
 */
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SeedService } from '../../seed/seed.service';

config();

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const seedService = app.get(SeedService);
  await seedService.run();
  await app.close();
}

main().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
