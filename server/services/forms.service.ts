import fs from "fs";
import path from "path";
import { FormTemplateSchema, type FormTemplate } from "@shared/contracts/forms";
import { compute, validate as validateTemplate } from "@shared/forms/engine";

const SEED_PATH = path.join(process.cwd(), "server", "seeds", "forms.nshev.json");

function loadSeedTemplate(): FormTemplate {
  const raw = fs.readFileSync(SEED_PATH, "utf8");
  return FormTemplateSchema.parse(JSON.parse(raw));
}

export async function listTemplates(tag?: string): Promise<FormTemplate[]> {
  if (tag && tag !== "nshev") return [];
  return [loadSeedTemplate()];
}

export async function validateForm(
  body: { formId?: string; values?: Record<string, unknown> },
): Promise<{ ok: boolean; errors: ReturnType<typeof validateTemplate> }> {
  const template = loadSeedTemplate();
  const computed = compute(body.values ?? {}, template);
  const errors = validateTemplate(computed, template);
  return { ok: errors.length === 0, errors };
}

export async function validate(
  body: { formId?: string; values?: Record<string, unknown> },
): Promise<{ ok: boolean; errors: ReturnType<typeof validateTemplate> }> {
  return validateForm(body);
}

export async function submit(
  body: { formId: string; values: Record<string, unknown> },
  _userId?: string,
): Promise<{ ok: boolean; errors: ReturnType<typeof validateTemplate>; reportId?: string }> {
  const template = loadSeedTemplate();
  const computed = compute(body.values, template);
  const errors = validateTemplate(computed, template);
  if (errors.length) {
    return { ok: false, errors, reportId: undefined };
  }
  return { ok: true, errors: [], reportId: undefined };
}
