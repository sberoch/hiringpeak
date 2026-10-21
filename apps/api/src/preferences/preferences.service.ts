import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { ZodType } from 'zod';
import {
  type LayoutKey,
  LayoutKeySchema,
  type SavedLayoutDto,
  type SavedLayouts,
  SavedLayoutSchema,
} from '@workspace/shared/dtos';
import { type UserLayout, userLayouts } from '@workspace/shared/schemas';
import { DrizzleProvider } from '../common/database/drizzle.module';
import type { DrizzleDatabase } from '../common/database/types/drizzle';

/**
 * A User's own preferences: their saved Column and Dashboard Layouts, one
 * per layout key. Personal, so no Permission and no Audit Events; callers
 * pass the authenticated User's id, never one from the request.
 */
@Injectable()
export class PreferencesService {
  constructor(@Inject(DrizzleProvider) private readonly db: DrizzleDatabase) {}

  /** Every layout the User saved, by layout key. Missing = default. */
  async findLayouts(userId: number): Promise<SavedLayouts> {
    const rows = await this.db
      .select({ layoutKey: userLayouts.layoutKey, value: userLayouts.value })
      .from(userLayouts)
      .where(eq(userLayouts.userId, userId));
    return Object.fromEntries(rows.map((row) => [row.layoutKey, row.value]));
  }

  /**
   * Saves (replaces) one layout. Rejects unknown layout keys and malformed
   * values; unknown entry keys are kept and ignored when resolving.
   */
  async saveLayout(
    userId: number,
    layoutKey: string,
    value: unknown,
  ): Promise<SavedLayoutDto> {
    const key = parse(LayoutKeySchema, layoutKey, 'Unknown layout key');
    const layout = parse(SavedLayoutSchema, value, 'Malformed layout');
    await this.db
      .insert(userLayouts)
      .values({ userId, layoutKey: key, value: layout })
      .onConflictDoUpdate({
        target: [userLayouts.userId, userLayouts.layoutKey],
        set: { value: layout, updatedAt: new Date() } as Partial<UserLayout>,
      });
    return layout;
  }

  /** Deleting is "reset": the layout falls back to the catalogue default. */
  async removeLayout(userId: number, layoutKey: string): Promise<void> {
    const key: LayoutKey = parse(
      LayoutKeySchema,
      layoutKey,
      'Unknown layout key',
    );
    await this.db
      .delete(userLayouts)
      .where(
        and(eq(userLayouts.userId, userId), eq(userLayouts.layoutKey, key)),
      );
  }
}

function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new BadRequestException(`${message}: ${result.error.message}`);
  }
  return result.data;
}
