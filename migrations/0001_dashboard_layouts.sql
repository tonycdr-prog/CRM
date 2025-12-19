CREATE TABLE "dashboard_layouts" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "name" text DEFAULT 'My dashboard' NOT NULL,
        "layout" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "is_default" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "dashboard_layout_user_idx" ON "dashboard_layouts" ("user_id");
