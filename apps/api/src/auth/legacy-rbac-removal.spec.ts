import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

describe('Legacy RBAC removal', () => {
  const authDir = resolve(__dirname, '.');
  const sharedSrc = resolve(__dirname, '../../../../packages/shared/src');

  it('roles.decorator.ts no longer exists', () => {
    expect(existsSync(resolve(authDir, 'roles/roles.decorator.ts'))).toBe(false);
  });

  it('roles.guard.ts no longer exists', () => {
    expect(existsSync(resolve(authDir, 'roles/roles.guard.ts'))).toBe(false);
  });

  it('ROLE_TO_PERMISSION_MAPPING.md no longer exists', () => {
    expect(existsSync(resolve(authDir, 'ROLE_TO_PERMISSION_MAPPING.md'))).toBe(false);
  });

  it('shared enums does not export UserRole', () => {
    const content = readFileSync(resolve(sharedSrc, 'enums.ts'), 'utf-8');
    expect(content).not.toMatch(/export\s+(const|type)\s+UserRole\b/);
  });

  it('shared types/user does not export UserRoleEnum or ROLES_NAMES', () => {
    const content = readFileSync(resolve(sharedSrc, 'types/user.ts'), 'utf-8');
    expect(content).not.toMatch(/export\s+(const|type)\s+UserRoleEnum\b/);
    expect(content).not.toMatch(/export\s+const\s+ROLES_NAMES\b/);
  });
});
