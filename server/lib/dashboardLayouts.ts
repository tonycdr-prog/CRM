import { randomUUID } from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  dashboardLayoutPayloadSchema,
  dashboardLayoutItemSchema,
  generateLayoutItemId,
  getWidget,
  type DashboardLayoutItem,
  type DashboardLayoutPayload,
} from "@shared/dashboard";
import { dashboardLayouts, type DashboardLayout } from "@shared/schema";

type DatabaseClient = typeof import("../db");

async function loadDb() {
  const mod: DatabaseClient = await import("../db");
  return mod.db;
}

export interface DashboardLayoutRepository {
  list(userId: string): Promise<DashboardLayout[]>;
  create(userId: string, payload: DashboardLayoutPayload, makeDefault: boolean): Promise<DashboardLayout>;
  update(layoutId: string, userId: string, payload: DashboardLayoutPayload): Promise<DashboardLayout | null>;
  setDefault(layoutId: string, userId: string): Promise<DashboardLayout | null>;
  getActive(userId: string): Promise<DashboardLayout | null>;
}

export async function validateLayoutForUser(payload: unknown, userId: string): Promise<DashboardLayoutPayload> {
  const parsed = dashboardLayoutPayloadSchema.parse(payload);
  const normalizedItems: DashboardLayoutItem[] = [];

  for (const item of parsed.items) {
    const normalized = dashboardLayoutItemSchema.parse(item);
    const widget = getWidget(normalized.widgetId);
    if (!widget) {
      throw new Error(`Unknown widget: ${normalized.widgetId}`);
    }

    const allowed = await widget.checkPermissions({ userId });
    if (!allowed) {
      throw new Error(`Widget not permitted: ${normalized.widgetId}`);
    }

    const params = widget.paramsSchema.parse(
      Object.keys(normalized.params || {}).length === 0 ? widget.defaultParams : normalized.params,
    );

    normalizedItems.push({
      id: normalized.id ?? generateLayoutItemId(),
      widgetId: normalized.widgetId,
      params,
      position: normalized.position,
    });
  }

  return { ...parsed, items: normalizedItems };
}

export class DbDashboardLayoutRepository implements DashboardLayoutRepository {
  constructor(private readonly dbPromise = loadDb()) {}

  async list(userId: string): Promise<DashboardLayout[]> {
    const db = await this.dbPromise;
    return db
      .select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, userId))
      .orderBy(desc(dashboardLayouts.updatedAt));
  }

  async create(userId: string, payload: DashboardLayoutPayload, makeDefault: boolean): Promise<DashboardLayout> {
    const db = await this.dbPromise;
    return db.transaction(async (tx) => {
      if (makeDefault) {
        await tx
          .update(dashboardLayouts)
          .set({ isDefault: false })
          .where(eq(dashboardLayouts.userId, userId));
      }

      const [created] = await tx
        .insert(dashboardLayouts)
        .values({
          userId,
          name: payload.name,
          layout: payload.items,
          isDefault: makeDefault,
        })
        .returning();

      return created;
    });
  }

  async update(layoutId: string, userId: string, payload: DashboardLayoutPayload): Promise<DashboardLayout | null> {
    const db = await this.dbPromise;
    const [updated] = await db
      .update(dashboardLayouts)
      .set({
        name: payload.name,
        layout: payload.items,
        updatedAt: sql`now()`,
      })
      .where(and(eq(dashboardLayouts.id, layoutId), eq(dashboardLayouts.userId, userId)))
      .returning();

    return updated ?? null;
  }

  async setDefault(layoutId: string, userId: string): Promise<DashboardLayout | null> {
    const db = await this.dbPromise;
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(dashboardLayouts)
        .where(and(eq(dashboardLayouts.id, layoutId), eq(dashboardLayouts.userId, userId)))
        .limit(1);

      if (!existing) return null;

      await tx.update(dashboardLayouts).set({ isDefault: false }).where(eq(dashboardLayouts.userId, userId));

      const [updated] = await tx
        .update(dashboardLayouts)
        .set({ isDefault: true, updatedAt: sql`now()` })
        .where(and(eq(dashboardLayouts.id, layoutId), eq(dashboardLayouts.userId, userId)))
        .returning();

      return updated ?? null;
    });
  }

  async getActive(userId: string): Promise<DashboardLayout | null> {
    const db = await this.dbPromise;
    const [preferred] = await db
      .select()
      .from(dashboardLayouts)
      .where(and(eq(dashboardLayouts.userId, userId), eq(dashboardLayouts.isDefault, true)))
      .limit(1);

    if (preferred) return preferred;

    const [latest] = await db
      .select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, userId))
      .orderBy(desc(dashboardLayouts.updatedAt))
      .limit(1);

    return latest ?? null;
  }
}

export class InMemoryDashboardLayoutRepository implements DashboardLayoutRepository {
  private layouts: DashboardLayout[] = [];

  async list(userId: string): Promise<DashboardLayout[]> {
    return this.layouts.filter((layout) => layout.userId === userId);
  }

  async create(userId: string, payload: DashboardLayoutPayload, makeDefault: boolean): Promise<DashboardLayout> {
    if (makeDefault) {
      this.layouts = this.layouts.map((layout) =>
        layout.userId === userId ? { ...layout, isDefault: false } : layout,
      );
    }

    const now = new Date();
    const layout: DashboardLayout = {
      id: randomUUID(),
      userId,
      name: payload.name,
      layout: payload.items,
      isDefault: makeDefault,
      createdAt: now,
      updatedAt: now,
    };

    this.layouts.push(layout);
    return layout;
  }

  async update(layoutId: string, userId: string, payload: DashboardLayoutPayload): Promise<DashboardLayout | null> {
    let updated: DashboardLayout | null = null;
    this.layouts = this.layouts.map((layout) => {
      if (layout.id === layoutId && layout.userId === userId) {
        updated = { ...layout, name: payload.name, layout: payload.items, updatedAt: new Date() };
        return updated;
      }
      return layout;
    });

    return updated;
  }

  async setDefault(layoutId: string, userId: string): Promise<DashboardLayout | null> {
    let updated: DashboardLayout | null = null;
    this.layouts = this.layouts.map((layout) => {
      if (layout.userId !== userId) return layout;
      if (layout.id === layoutId) {
        updated = { ...layout, isDefault: true, updatedAt: new Date() };
        return updated;
      }
      return { ...layout, isDefault: false };
    });

    return updated;
  }

  async getActive(userId: string): Promise<DashboardLayout | null> {
    const preferred = this.layouts.find((layout) => layout.userId === userId && layout.isDefault);
    if (preferred) return preferred;
    const candidates = this.layouts
      .filter((layout) => layout.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return candidates[0] ?? null;
  }
}

export async function shouldMakeDefault(repository: DashboardLayoutRepository, userId: string): Promise<boolean> {
  const existing = await repository.list(userId);
  return existing.length === 0;
}
