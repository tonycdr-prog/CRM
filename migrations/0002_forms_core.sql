CREATE TABLE "form_templates_core" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" varchar NOT NULL REFERENCES "organizations"("id"),
    "name" text NOT NULL,
    "description" text,
    "created_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "form_templates_core_org_idx" ON "form_templates_core" ("organization_id");

CREATE TABLE "form_versions_core" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "template_id" varchar NOT NULL REFERENCES "form_templates_core"("id"),
    "version_number" integer NOT NULL,
    "status" text DEFAULT 'draft' NOT NULL,
    "title" text,
    "notes" text,
    "definition" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "published_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "form_versions_core_template_idx" ON "form_versions_core" ("template_id");

CREATE TABLE "entity_templates_core" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "form_version_id" varchar NOT NULL REFERENCES "form_versions_core"("id"),
    "title" text NOT NULL,
    "description" text,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "definition" jsonb NOT NULL,
    "created_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "entity_templates_core_version_idx" ON "entity_templates_core" ("form_version_id");

CREATE TABLE "form_submissions_core" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "form_version_id" varchar NOT NULL REFERENCES "form_versions_core"("id"),
    "job_id" varchar NOT NULL REFERENCES "jobs"("id"),
    "organization_id" varchar NOT NULL REFERENCES "organizations"("id"),
    "status" text DEFAULT 'in_progress' NOT NULL,
    "created_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "submitted_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "form_submissions_core_version_idx" ON "form_submissions_core" ("form_version_id");
--> statement-breakpoint
CREATE INDEX "form_submissions_core_job_idx" ON "form_submissions_core" ("job_id");
--> statement-breakpoint
CREATE INDEX "form_submissions_core_org_idx" ON "form_submissions_core" ("organization_id");

CREATE TABLE "entity_instances_core" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "submission_id" varchar NOT NULL REFERENCES "form_submissions_core"("id"),
    "entity_template_id" varchar NOT NULL REFERENCES "entity_templates_core"("id"),
    "answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "status" text DEFAULT 'in_progress' NOT NULL,
    "created_by_user_id" varchar NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "entity_instances_core_submission_idx" ON "entity_instances_core" ("submission_id");
--> statement-breakpoint
CREATE INDEX "entity_instances_core_template_idx" ON "entity_instances_core" ("entity_template_id");
