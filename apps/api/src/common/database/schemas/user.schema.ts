import {
  boolean,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { UserRole } from '@workspace/shared/enums';
import * as bcrypt from 'bcryptjs';

export const roleEnum = pgEnum(
  'role',
  Object.values(UserRole) as [string, ...string[]],
);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  active: boolean('active').default(true),
  role: roleEnum('role').notNull(),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  if (!/^\$2a\$\d+\$/.test(password)) {
    return await bcrypt.hash(password, salt);
  }
  return password;
}

export async function checkPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export function excludePassword(user: any): any {
  const { password, ...result } = user;
  return result;
}
