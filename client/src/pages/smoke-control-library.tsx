import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";

interface SystemType {
  id: string;
  code: string;
  name: string;
  standard?: string | null;
}

interface LibraryEntity {
  id: string;
  name: string;
  description?: string | null;
  standard?: string | null;
  sortOrder?: number | null;
  definition?: { fields?: Array<{ id: string; label: string }> };
}

export default function SmokeControlLibraryPage() {
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/csrf-token", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data?.csrfToken ?? null))
      .catch(() => setCsrfToken(null));
  }, []);

  const systemTypesQuery = useQuery<{ systemTypes: SystemType[] }>({
    queryKey: ["smoke-system-types"],
    queryFn: async () => {
      const res = await fetch("/api/smoke-control/system-types");
      if (!res.ok) throw new Error("Failed to load system types");
      return res.json();
    },
  });

  const entitiesQuery = useQuery<{ entities: LibraryEntity[] }>({
    queryKey: ["smoke-entities", selectedCode],
    queryFn: async () => {
      const res = await fetch(`/api/smoke-control/system-types/${selectedCode}/entities`);
      if (!res.ok) throw new Error("Failed to load entities");
      return res.json();
    },
    enabled: !!selectedCode,
  });

  const generateMutation = useMutation<any, Error, void>({
    mutationFn: async () => {
      const res = await fetch("/api/forms/generate-from-system-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ systemTypeCode: selectedCode, templateName }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any)?.message ?? "Generation failed");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Template generated",
        description: `${data?.template?.name ?? "Template"} with ${data?.version?.entities?.length ?? 0} entities created.`,
      });
    },
    onError: (error) => {
      toast({ title: "Generation failed", description: error?.message ?? "Unable to generate", variant: "destructive" });
    },
  });

  const orderedEntities = useMemo(() => {
    const list = entitiesQuery.data?.entities ?? [];
    return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [entitiesQuery.data]);

  const selectedType = useMemo(() => {
    return systemTypesQuery.data?.systemTypes?.find((t: SystemType) => t.code === selectedCode);
  }, [selectedCode, systemTypesQuery.data]);

  const disableGenerate = !selectedCode || !templateName || generateMutation.isPending;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Smoke Control Library</h1>
        <p className="text-muted-foreground">
          Generate standards-aligned form templates for smoke control system types without rebuilding entities by hand.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select system type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemTypesQuery.isLoading ? (
            <div className="flex items-center gap-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-32" /></div>
          ) : systemTypesQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load system types.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">System type</label>
                <Select value={selectedCode} onValueChange={(value) => setSelectedCode(value)}>
                  <SelectTrigger aria-label="Select system type">
                    <SelectValue placeholder="Choose a system type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(systemTypesQuery.data?.systemTypes ?? []).map((type: SystemType) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.name} ({type.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedType?.standard ? (
                  <p className="text-xs text-muted-foreground">Aligned to {selectedType.standard}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Template name</label>
                <Input
                  placeholder="e.g. PSS Initial Commissioning"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => generateMutation.mutate()} disabled={disableGenerate}>
              {generateMutation.isPending ? "Generating..." : "Generate template"}
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.FORMS_BUILDER}>Go to builder</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.FORMS_RUNNER}>Open runner</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required entities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedCode ? (
            <p className="text-sm text-muted-foreground">Select a system type to view the required entities.</p>
          ) : entitiesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : entitiesQuery.isError ? (
            <p className="text-sm text-red-600">Unable to load required entities for this system type.</p>
          ) : orderedEntities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entities mapped for this system type yet.</p>
          ) : (
            <ul className="space-y-3">
              {orderedEntities.map((entity: LibraryEntity) => (
                <li key={entity.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium leading-tight">{entity.name}</div>
                      {entity.description ? (
                        <p className="text-sm text-muted-foreground">{entity.description}</p>
                      ) : null}
                    </div>
                    {entity.standard ? <Badge variant="secondary">{entity.standard}</Badge> : null}
                  </div>
                  {entity.definition?.fields?.length ? (
                    <p className="text-xs text-muted-foreground mt-2">
                      Fields: {entity.definition.fields.map((field: { label: string }) => field.label).join(", ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
