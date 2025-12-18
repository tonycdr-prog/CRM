// client/src/hooks/useMe.ts
import { useEffect, useMemo, useState } from "react";

export type MeDTO = {
  userId: string;
  organizationId: string;
  organizationRole: "owner" | "admin" | "office_staff" | "engineer" | "viewer";
  role?: "admin" | "office_manager" | "field_engineer";
  email?: string;
  firstName?: string;
  lastName?: string;
};

export function useMe() {
  const [me, setMe] = useState<MeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load user (${res.status})`);
      const data = (await res.json()) as MeDTO;
      setMe(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load user");
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const isOrgAdmin = useMemo(() => {
    const r = me?.organizationRole;
    return r === "owner" || r === "admin";
  }, [me?.organizationRole]);

  const displayName = useMemo(() => {
    const fn = me?.firstName?.trim();
    const ln = me?.lastName?.trim();
    const full = [fn, ln].filter(Boolean).join(" ");
    return full || me?.email || "User";
  }, [me?.firstName, me?.lastName, me?.email]);

  return { me, loading, error, reload: load, isOrgAdmin, displayName };
}
