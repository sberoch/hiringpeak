import * as schema from '../schemas/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

export type FindManyQueryConfig<T extends RelationalQueryBuilder<any, any>> =
  Parameters<T['findMany']>[0];
