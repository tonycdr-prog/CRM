import { Router } from "express";
import { asyncHandler, type AuthenticatedRequest } from "./utils/routeHelpers";
import { DbFormsRepository, type FormsRepository, InMemoryFormsRepository } from "./lib/forms";
import { resolveOrganizationId } from "./formsRoutes";

export function createSmokeControlRouter(options?: { repository?: FormsRepository }) {
  const repository = options?.repository ?? new DbFormsRepository();
  const router = Router();

  router.get(
    "/system-types",
    asyncHandler(async (req, res) => {
      const organizationId = resolveOrganizationId(req as AuthenticatedRequest, req.query.organizationId as string | undefined);
      const systemTypes = await repository.listSmokeControlSystemTypes(organizationId);
      res.json({ systemTypes });
    }),
  );

  router.get(
    "/system-types/:code/entities",
    asyncHandler(async (req, res) => {
      const organizationId = resolveOrganizationId(req as AuthenticatedRequest, req.query.organizationId as string | undefined);
      const entities = await repository.listSystemTypeEntities(req.params.code, organizationId);
      if (!entities.length) return res.status(404).json({ message: "System type not found" });
      res.json({ entities });
    }),
  );

  return router;
}

export function createInMemorySmokeControlRouter() {
  return createSmokeControlRouter({ repository: new InMemoryFormsRepository() });
}
