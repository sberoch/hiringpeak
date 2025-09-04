import { drizzle } from 'drizzle-orm/node-postgres';
import { reset } from 'drizzle-seed';
import * as schema from './schemas/schema';
import { config } from 'dotenv';

config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const db = drizzle(process.env.DATABASE_URL!);
  await reset(db, schema);
  console.log('🧹 Database reset successfully! 🗑️');
}

main().catch((error) => {
  console.error('Error resetting database:', error);
  process.exit(1);
});
