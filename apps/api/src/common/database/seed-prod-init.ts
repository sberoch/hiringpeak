import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { seed } from 'drizzle-seed';
import { hashPassword, users } from '@workspace/shared/schemas';

config();

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const db = drizzle(process.env.DATABASE_URL!);
  const hashedPassword = await hashPassword('12345678');

  await seed(db, { users }).refine((f) => ({
    users: {
      count: 1,
      columns: {
        id: f.default({
          defaultValue: 1000,
        }),
        email: f.default({
          defaultValue: 'admin@gmail.com',
        }),
        password: f.default({
          defaultValue: hashedPassword,
        }),
        active: f.default({
          defaultValue: true,
        }),
      },
    },
  }));

  console.log('🌱 Database seeded successfully! 🪴');
}

main().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
