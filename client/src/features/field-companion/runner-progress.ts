const PREFIX = "companion:runner";

type ProgressPayload = {
  inspectionId: string;
  completion: number;
  updatedAt: number;
  instrumentId?: string;
};

export function loadRunnerProgress(jobId: string | undefined, templateId: string | undefined) {
  if (!jobId || !templateId) return null;
  const raw = localStorage.getItem(`${PREFIX}:${jobId}:${templateId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProgressPayload;
  } catch (e) {
    console.warn("Failed to parse runner progress", e);
    return null;
  }
}

export function saveRunnerProgress(jobId: string | undefined, templateId: string | undefined, payload: ProgressPayload) {
  if (!jobId || !templateId) return;
  localStorage.setItem(`${PREFIX}:${jobId}:${templateId}`, JSON.stringify(payload));
}

export function clearRunnerProgress(jobId: string | undefined, templateId: string | undefined) {
  if (!jobId || !templateId) return;
  localStorage.removeItem(`${PREFIX}:${jobId}:${templateId}`);
}
