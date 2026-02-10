import * as schema from '@workspace/shared/schemas';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

export interface DbOptions {
  tx?: DrizzleDatabase;
}

export type FindManyQueryConfig<T extends RelationalQueryBuilder<any, any>> =
  Parameters<T['findMany']>[0];
