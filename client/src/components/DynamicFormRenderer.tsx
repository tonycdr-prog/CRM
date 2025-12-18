import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FieldType = "pass_fail" | "number" | "text" | "choice";

export type SystemTypeDTO = { id: string; name: string; code: string };
export type TemplateListItemDTO = { id: string; name: string; systemTypeCode: string };

export type EntityRowDTO = {
  id: string;
  component: string;
  activity: string;
  reference?: string;
  fieldType: FieldType;
  units?: string;
  choices?: string[];
  evidenceRequired?: boolean;
};

export type EntityDTO = {
  id: string;
  title: string;
  description?: string;
  rows: EntityRowDTO[];
};

export type FormTemplateDTO = {
  id: string;
  name: string;
  entities: EntityDTO[];
};

export type ResponseDraft = {
  rowId: string;
  value: string | number | boolean | null;
  comment?: string;
};

export type RowAttachmentDTO = {
  attachmentId: string;
  rowId: string;
  fileId: string;
  originalName: string;
  mimeType?: string | null;
  sizeBytes: number;
  createdAt?: string;
};

function findDraft(drafts: ResponseDraft[], rowId: string) {
  return drafts.find((d) => d.rowId === rowId);
}

export default function DynamicFormRenderer(props: {
  template: FormTemplateDTO;
  responses: ResponseDraft[];
  readOnly: boolean;
  attachmentsByRowId?: Record<string, RowAttachmentDTO[]>;
  onUpload?: (rowId: string, file: File) => Promise<void>;
  onChange: (drafts: ResponseDraft[]) => void;
}) {
  const { template, responses, readOnly, attachmentsByRowId, onUpload, onChange } = props;

  function upsert(rowId: string, patch: Partial<ResponseDraft>) {
    const existing = findDraft(responses, rowId);
    const next = existing
      ? responses.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r))
      : [...responses, { rowId, value: null, ...patch }];

    onChange(next);
  }

  return (
    <div className="space-y-6">
      {template.entities.map((entity) => (
        <div key={entity.id} className="border rounded-md p-4 space-y-3">
          <div>
            <div className="font-semibold">{entity.title}</div>
            {entity.description && (
              <div className="text-sm text-muted-foreground">{entity.description}</div>
            )}
          </div>

          <div className="space-y-4">
            {entity.rows.map((row) => {
              const draft = findDraft(responses, row.id);
              const value = draft?.value;

              return (
                <div key={row.id} className="border-t pt-3">
                  <div className="font-medium">
                    {row.component} — {row.activity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.reference ? <>Ref: {row.reference}</> : null}
                    {row.reference && row.evidenceRequired ? " • " : null}
                    {row.evidenceRequired ? <>Evidence required</> : null}
                  </div>

                  <div className="mt-2 flex flex-col gap-2 max-w-xl">
                    {row.fieldType === "pass_fail" && (
                      <div>
                        <Label>Result</Label>
                        <Select
                          value={value === true ? "pass" : value === false ? "fail" : ""}
                          onValueChange={(v) =>
                            upsert(row.id, { value: v === "pass" ? true : v === "fail" ? false : null })
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {row.fieldType === "number" && (
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label>Value</Label>
                          <Input
                            type="number"
                            value={typeof value === "number" ? String(value) : ""}
                            onChange={(e) =>
                              upsert(row.id, {
                                value: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            disabled={readOnly}
                          />
                        </div>
                        {row.units && (
                          <div className="text-sm text-muted-foreground pb-2">{row.units}</div>
                        )}
                      </div>
                    )}

                    {row.fieldType === "text" && (
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={typeof value === "string" ? value : ""}
                          onChange={(e) => upsert(row.id, { value: e.target.value })}
                          disabled={readOnly}
                        />
                      </div>
                    )}

                    {row.fieldType === "choice" && (
                      <div>
                        <Label>Value</Label>
                        <Select
                          value={typeof value === "string" ? value : ""}
                          onValueChange={(v) => upsert(row.id, { value: v })}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select…" />
                          </SelectTrigger>
                          <SelectContent>
                            {(row.choices ?? []).map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label>Comment (optional)</Label>
                      <Input
                        value={draft?.comment ?? ""}
                        onChange={(e) => upsert(row.id, { comment: e.target.value })}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
