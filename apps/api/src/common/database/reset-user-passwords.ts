import 'dotenv/config';
import crypto from 'node:crypto';
import { Pool } from 'pg';
import { hashPassword } from '@workspace/shared/schemas';
import { passwordSchema } from '@workspace/shared/lib/password.schema';

type TargetUser = {
  id: number;
  email: string;
  name: string;
  organization_id: number | null;
};

type PasswordPlan = TargetUser & {
  password: string;
};

const CONFIRM_VALUE = 'yes';

function parseEmails(value: string | undefined): string[] | null {
  if (!value?.trim()) return null;
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function parsePasswordMap(value: string | undefined): Map<string, string> {
  if (!value?.trim()) return new Map();
  const parsed = JSON.parse(value) as Record<string, string>;
  return new Map(
    Object.entries(parsed).map(([email, password]) => [
      email.toLowerCase(),
      password,
    ]),
  );
}

function generatePassword() {
  const random = crypto.randomBytes(12).toString('base64url');
  return `Hp${random}1+`;
}

function validatePassword(email: string, password: string) {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    throw new Error(
      `Password for ${email} does not satisfy the app password policy: ${result.error.issues
        .map((issue) => issue.message)
        .join('; ')}`,
    );
  }
}

async function loadTargetUsers(pool: Pool) {
  const orgName = process.env.RESET_ORG_NAME ?? 'Pratt';
  const orgId = process.env.RESET_ORG_ID
    ? Number(process.env.RESET_ORG_ID)
    : undefined;
  const emails = parseEmails(process.env.RESET_USER_EMAILS);

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (orgId != null) {
    params.push(orgId);
    conditions.push(`u.organization_id = $${params.length}`);
  } else {
    params.push(orgName);
    conditions.push(`o.name = $${params.length}`);
  }

  if (emails?.length) {
    params.push(emails);
    conditions.push(`lower(u.email) = ANY($${params.length}::text[])`);
  }

  const result = await pool.query<TargetUser>(
    `
      SELECT u.id, u.email, u.name, u.organization_id
      FROM public.users u
      LEFT JOIN public.organizations o ON o.id = u.organization_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.id
    `,
    params,
  );

  return result.rows;
}

function buildPasswordPlan(users: TargetUser[]): PasswordPlan[] {
  const sharedPassword = process.env.RESET_SHARED_PASSWORD;
  const passwordMap = parsePasswordMap(process.env.RESET_PASSWORDS_JSON);
  const generateRandom =
    process.env.RESET_GENERATE_RANDOM_PASSWORDS === 'true' ||
    (!sharedPassword && passwordMap.size === 0);

  const plan = users.map((user) => {
    const mappedPassword = passwordMap.get(user.email.toLowerCase());
    const password = mappedPassword
      ?? sharedPassword
      ?? (generateRandom ? generatePassword() : undefined);

    if (!password) {
      throw new Error(
        `No password supplied for ${user.email}. Set RESET_SHARED_PASSWORD, RESET_PASSWORDS_JSON, or RESET_GENERATE_RANDOM_PASSWORDS=true.`,
      );
    }
    validatePassword(user.email, password);
    return { ...user, password };
  });

  for (const email of passwordMap.keys()) {
    if (!users.some((user) => user.email.toLowerCase() === email)) {
      throw new Error(
        `RESET_PASSWORDS_JSON includes ${email}, but that user is not in the selected reset set.`,
      );
    }
  }

  return plan;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const users = await loadTargetUsers(pool);
    if (users.length === 0) {
      throw new Error('No users matched the reset filters.');
    }

    const plan = buildPasswordPlan(users);
    const confirmed =
      process.env.CONFIRM_RESET_USER_PASSWORDS === CONFIRM_VALUE;

    console.log(`Matched ${plan.length} user(s):`);
    for (const user of plan) {
      console.log(`  ${user.id}\t${user.email}\t${user.name}`);
    }

    if (!confirmed) {
      console.log('');
      console.log(
        `Dry run only. Set CONFIRM_RESET_USER_PASSWORDS=${CONFIRM_VALUE} to update passwords.`,
      );
      return;
    }

    await pool.query('BEGIN');
    try {
      for (const user of plan) {
        const hashedPassword = await hashPassword(user.password);
        await pool.query(
          `
            UPDATE public.users
            SET password = $1,
                updated_at = now()
            WHERE id = $2
          `,
          [hashedPassword, user.id],
        );
      }
      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

    console.log('');
    console.log('Passwords reset. Temporary credentials:');
    console.log('id,email,name,password');
    for (const user of plan) {
      console.log(
        `${user.id},${user.email},${JSON.stringify(user.name)},${user.password}`,
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Password reset failed:', error);
  process.exit(1);
});
