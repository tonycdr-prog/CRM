import { Router } from "express";
import { generateLayoutItemId, listWidgets } from "@shared/dashboard";
import { type DashboardLayout } from "@shared/schema";
import {
  DbDashboardLayoutRepository,
  type DashboardLayoutRepository,
  shouldMakeDefault,
  validateLayoutForUser,
} from "./lib/dashboardLayouts";
import { asyncHandler, getUserId, type AuthenticatedRequest } from "./utils/routeHelpers";

function ensureLayoutItemIds(layoutItems: DashboardLayout["layout"] = []) {
  return layoutItems.map((item) => ({ ...item, id: (item as any).id ?? generateLayoutItemId() }));
}

function toLayoutResponse(layout: DashboardLayout | null) {
  if (!layout) return null;
  return {
    id: layout.id,
    name: layout.name,
    items: ensureLayoutItemIds(layout.layout),
    isDefault: layout.isDefault,
    createdAt: layout.createdAt,
    updatedAt: layout.updatedAt,
  };
}

export function createDashboardRouter(options?: { repository?: DashboardLayoutRepository }) {
  const repository = options?.repository ?? new DbDashboardLayoutRepository();
  const router = Router();

  router.get(
    "/widgets",
    asyncHandler(async (_req, res) => {
      res.json({ widgets: listWidgets() });
    }),
  );

  router.get(
    "/layout",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      const layout = await repository.getActive(userId);
      res.json({ layout: toLayoutResponse(layout) });
    }),
  );

  router.post(
    "/layouts",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const payload = await validateLayoutForUser(req.body, userId);
        const created = await repository.create(
          userId,
          payload,
          await shouldMakeDefault(repository, userId),
        );
        res.status(201).json({ layout: toLayoutResponse(created) });
      } catch (error) {
        res.status(400).json({ message: (error as Error).message });
      }
    }),
  );

  router.put(
    "/layouts/:layoutId",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      try {
        const payload = await validateLayoutForUser(req.body, userId);
        const updated = await repository.update(req.params.layoutId, userId, payload);
        if (!updated) return res.status(404).json({ message: "Layout not found" });
        res.json({ layout: toLayoutResponse(updated) });
      } catch (error) {
        res.status(400).json({ message: (error as Error).message });
      }
    }),
  );

  router.post(
    "/layouts/:layoutId/default",
    asyncHandler(async (req, res) => {
      const userId = getUserId(req as AuthenticatedRequest);
      const updated = await repository.setDefault(req.params.layoutId, userId);
      if (!updated) return res.status(404).json({ message: "Layout not found" });
      res.json({ layout: toLayoutResponse(updated) });
    }),
  );

  return router;
}
