import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas/schema';

export const DrizzleProvider = Symbol('drizzle-connection');

@Module({
  providers: [
    {
      provide: DrizzleProvider,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL');
        const pool = new Pool({ connectionString: dbUrl });
        return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
      },
    },
  ],
  exports: [DrizzleProvider],
})
export class DrizzleModule {}
