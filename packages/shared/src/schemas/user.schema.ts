import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { UserRole, UserType } from "../enums";
import * as bcrypt from "bcryptjs";
import { organizations } from "./organization.schema";
import { roles } from "./role.schema";

export const roleEnum = pgEnum(
  "role",
  Object.values(UserRole) as [string, ...string[]]
);

export const userTypeEnum = pgEnum(
  "user_type",
  Object.values(UserType) as [string, ...string[]]
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    active: boolean("active").default(true),
    /** @deprecated Legacy; use roleId for tenant RBAC. Kept for transition and SYSTEM_ADMIN. */
    role: roleEnum("role").notNull(),
    /** Internal-only: web vs backoffice. Never expose via API. */
    userType: userTypeEnum("user_type").notNull().default("END_USER"),
    organizationId: integer("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    roleId: integer("role_id").references(() => roles.id, {
      onDelete: "set null",
    }),
    lastLogin: timestamp("last_login"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    emailOrgUnique: unique().on(table.email, table.organizationId),
  })
);

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt();
  if (!/^\$2a\$\d+\$/.test(password)) {
    return await bcrypt.hash(password, salt);
  }
  return password;
}

export async function checkPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export function excludePassword(user: any): any {
  const { password, ...result } = user;
  return result;
}

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
