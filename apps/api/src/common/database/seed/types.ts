import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@workspace/shared/schemas';

export type SeedTx = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];
