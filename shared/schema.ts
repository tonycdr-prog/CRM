import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const systemTypeEnum = z.enum(["push", "pull", "push-pull", ""]);

export const testSchema = z.object({
  id: z.string(),
  testDate: z.string(),
  building: z.string(),
  location: z.string(),
  floorNumber: z.string(),
  shaftId: z.string(),
  systemType: systemTypeEnum,
  testerName: z.string(),
  notes: z.string(),
  readings: z.array(z.union([z.number(), z.literal("")])),
  gridSize: z.number().optional(),
  average: z.number(),
  damperWidth: z.number().optional(),
  damperHeight: z.number().optional(),
  freeArea: z.number().optional(),
  damperOpenImage: z.string().optional(),
  damperClosedImage: z.string().optional(),
  createdAt: z.number(),
}).refine((data) => {
  const validLengths = [8, 25, 36, 49];
  return validLengths.includes(data.readings.length);
}, {
  message: "Readings array must be 8 (legacy), 25 (5x5), 36 (6x6), or 49 (7x7) points",
  path: ["readings"],
});

export type Test = z.infer<typeof testSchema>;
