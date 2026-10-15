import { beforeEach, describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';
import type { AuditLogService } from './audit-log.service';

/** The audit log shows commercial events only to callers with commercial access. */
let auditLog: AuditLogService;
let org: number;

const COMMERCIAL_EVENTS = [
  ['create_opportunity', 'opportunity'],
  ['change_opportunity_stage', 'opportunity'],
  ['update_contact', 'contact'],
  ['create_interaction', 'interaction'],
  ['update_opportunity_stage', 'opportunity_stage'],
  ['create_lost_reason', 'lost_reason'],
  ['delete_contact_source', 'contact_source'],
  ['set_company_account_owner', 'company'],
];

beforeEach(async () => {
  const db = await createTestDatabase();
  const services = await testServices(db);
  auditLog = services.auditLog;
  const f = fixtures(db);
  org = await f.organization();
  const actorUserId = await f.user(org, []);
  for (const [eventType, entityType] of [
    ...COMMERCIAL_EVENTS,
    ['update_company', 'company'],
    ['create_vacancy', 'vacancy'],
  ]) {
    await services.audit.record({
      eventType,
      entityType,
      organizationId: org,
      actorUserId,
    });
  }
});

const eventTypes = (items: { eventType: string }[]) =>
  items.map((item) => item.eventType).sort();

describe('AuditLogService', () => {
  it('leaves commercial events out for a caller without commercial access', async () => {
    const page = await auditLog.findAll({
      organizationId: org,
      commercialAccess: false,
    });
    expect(eventTypes(page.items)).toEqual([
      'create_vacancy',
      'update_company',
    ]);
  });

  it('leaves commercial events out of the export for a caller without commercial access', async () => {
    const items = await auditLog.findAllForExport({
      organizationId: org,
      commercialAccess: false,
    });
    expect(eventTypes(items)).toEqual(['create_vacancy', 'update_company']);
  });

  it('shows every event to a caller with commercial access', async () => {
    const page = await auditLog.findAll({
      organizationId: org,
      commercialAccess: true,
    });
    expect(page.meta.totalItems).toBe(COMMERCIAL_EVENTS.length + 2);
  });
});
