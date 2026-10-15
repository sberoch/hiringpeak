import { describe, expect, it } from 'vitest';
import { PermissionCode } from '@workspace/shared/enums';
import {
  contactOwnerViolation,
  defaultContactOwner,
  networkFieldViolation,
} from './contact-policy';

const PARTNER = [PermissionCode.CRM_MANAGE, PermissionCode.COMPANY_MANAGE];
const RECRUITER = [PermissionCode.COMPANY_MANAGE];

describe('defaultContactOwner', () => {
  it('defaults the Contact Owner to a creator with commercial access', () => {
    expect(defaultContactOwner(undefined, { id: 7, codes: PARTNER })).toBe(7);
  });

  it('leaves the Contact without an owner when the creator has no commercial access', () => {
    expect(defaultContactOwner(undefined, { id: 7, codes: RECRUITER })).toBe(
      null,
    );
  });

  it('keeps an explicit "Sin responsable"', () => {
    expect(defaultContactOwner(null, { id: 7, codes: PARTNER })).toBe(null);
  });

  it('keeps an explicitly chosen owner', () => {
    expect(defaultContactOwner(9, { id: 7, codes: PARTNER })).toBe(9);
  });
});

describe('contactOwnerViolation', () => {
  it('rejects an owner without commercial access', () => {
    expect(contactOwnerViolation(3, [1, 2])).not.toBeNull();
  });

  it('accepts an owner with commercial access', () => {
    expect(contactOwnerViolation(2, [1, 2])).toBeNull();
  });

  it('accepts no owner', () => {
    expect(contactOwnerViolation(null, [1, 2])).toBeNull();
  });
});

describe('networkFieldViolation', () => {
  it('lets a commercial user create a Contact without a Company', () => {
    expect(
      networkFieldViolation({ sourceId: 1, ownerId: 2 }, PARTNER),
    ).toBeNull();
  });

  it('lets a recruiter create a Contact on a Company', () => {
    expect(networkFieldViolation({ companyId: 4 }, RECRUITER)).toBeNull();
  });

  it('stops a recruiter from creating a Contact without a Company', () => {
    expect(networkFieldViolation({}, RECRUITER)).not.toBeNull();
  });

  it.each([
    ['Origen', { sourceId: 1 }],
    ['Responsable', { ownerId: 2 }],
    ['descripción corta', { shortDescription: 'CFO de fintech' }],
  ])('stops a recruiter from setting the %s', (_field, write) => {
    expect(
      networkFieldViolation({ companyId: 4, ...write }, RECRUITER),
    ).not.toBeNull();
  });

  it('stops a recruiter from taking a Contact off its Company', () => {
    expect(
      networkFieldViolation({ companyId: null }, RECRUITER, { companyId: 4 }),
    ).not.toBeNull();
  });

  it('lets a recruiter move a Contact to another Company', () => {
    expect(
      networkFieldViolation({ companyId: 5 }, RECRUITER, { companyId: 4 }),
    ).toBeNull();
  });

  it('stops a recruiter from editing a Contact without a Company', () => {
    expect(
      networkFieldViolation({}, RECRUITER, { companyId: null }),
    ).not.toBeNull();
  });

  it('lets a commercial user take a Contact off its Company', () => {
    expect(
      networkFieldViolation({ companyId: null }, PARTNER, { companyId: 4 }),
    ).toBeNull();
  });
});
