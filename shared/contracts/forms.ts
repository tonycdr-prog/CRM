import { z } from "zod";

export const FieldSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "number", "bool", "enum", "calc"]),
  label: z.string(),
  unit: z.string().optional(),
  max: z.number().optional(),
  options: z.array(z.string()).optional(),
});

export const FormulaSchema = z.object({
  out: z.string(),
  expr: z.string(),
  deps: z.array(z.string()),
});

export const RuleSchema = z.object({
  when: z.string(),
  severity: z.enum(["block", "warn"]),
  ref: z.string().optional(),
});

export const FormTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(FieldSchema),
  formulas: z.array(FormulaSchema),
  rules: z.array(RuleSchema),
  refs: z.array(z.string()),
});

export const FormInstanceSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  templateId: z.string(),
  values: z.record(z.unknown()),
  status: z.enum(["draft", "submitted"]),
  signatures: z.unknown().optional(),
});

export type FormTemplate = z.infer<typeof FormTemplateSchema>;
export type FormInstance = z.infer<typeof FormInstanceSchema>;
