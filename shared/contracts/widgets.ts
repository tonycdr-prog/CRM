import { z } from "zod";

export const WidgetEventSchema = z.object({
  type: z.string(),
  payload: z.unknown().optional(),
  ctx: z.object({
    orgId: z.string(),
    siteId: z.string().optional(),
    jobId: z.string().optional(),
  }),
});

export type WidgetEvent = z.infer<typeof WidgetEventSchema>;

export type WidgetDef = {
  key: string;
  title: string;
  propsSchema: z.ZodTypeAny;
  eventsIn: string[];
  eventsOut: string[];
  query: (ctx: unknown, props: unknown) => Promise<unknown>;
  actions: { key: string; title: string; onInvoke: (ctx: unknown, input: unknown) => Promise<void> }[];
};
