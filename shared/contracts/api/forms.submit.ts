import { z } from "zod";

export const SubmitBodySchema = z.object({
  formId: z.string(),
  values: z.record(z.unknown()),
  instrumentIds: z.array(z.string()).optional(),
});

export const SubmitResultSchema = z.object({
  ok: z.boolean(),
  reportId: z.string().optional(),
  errors: z.array(
    z.object({
      path: z.string(),
      message: z.string(),
      ref: z.string().optional(),
    }),
  ),
});

export type SubmitBody = z.infer<typeof SubmitBodySchema>;
export type SubmitResult = z.infer<typeof SubmitResultSchema>;
