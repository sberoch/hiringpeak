import { PermissionCode } from '@workspace/shared/enums';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixtures } from '../common/database/testing/fixtures';
import { createTestDatabase } from '../common/database/testing/test-database';
import { testServices } from '../common/database/testing/test-services';

/** Basic is the recruiter's Role: it loads Candidates and Vacancies, but not Companies. */
let services: Awaited<ReturnType<typeof testServices>>;
let f: ReturnType<typeof fixtures>;
let org: number;

beforeEach(async () => {
  const db = await createTestDatabase();
  services = await testServices(db);
  f = fixtures(db);
  org = await f.organization();
});

const basicCodes = async () => {
  const { basicRoleId } =
    await services.roles.createDefaultRolesForOrganization(org);
  return services.authz.getPermissionCodesForUser(
    await f.member(org, basicRoleId),
  );
};

describe("a new Organization's Basic Role", () => {
  it('manages Candidates and Vacancies', async () => {
    expect(await basicCodes()).toEqual(
      expect.arrayContaining([
        PermissionCode.CANDIDATE_MANAGE,
        PermissionCode.VACANCY_MANAGE,
      ]),
    );
  });

  it('does not manage Companies', async () => {
    expect(await basicCodes()).not.toContain(PermissionCode.COMPANY_MANAGE);
  });
});
