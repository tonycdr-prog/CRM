// client/src/lib/flash.ts
const KEY = "lso_flash_message";

export type FlashMessage = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function setFlash(msg: FlashMessage) {
  sessionStorage.setItem(KEY, JSON.stringify(msg));
}

export function popFlash(): FlashMessage | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as FlashMessage;
  } catch {
    return null;
  }
}
