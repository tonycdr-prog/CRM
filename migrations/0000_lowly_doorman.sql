CREATE TABLE "absences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"technician_id" varchar,
	"technician_name" text NOT NULL,
	"type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"half_day" boolean DEFAULT false,
	"half_day_period" text,
	"notes" text,
	"status" text DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "asset_batches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"project_id" varchar,
	"batch_name" text NOT NULL,
	"asset_type" text NOT NULL,
	"visit_type" text,
	"quantity" integer NOT NULL,
	"starting_floor" text,
	"starting_area" text,
	"numbering_prefix" text NOT NULL,
	"starting_number" integer DEFAULT 1 NOT NULL,
	"numbering_format" text DEFAULT '###',
	"building" text,
	"created_assets_count" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" text NOT NULL,
	"changes" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "callbacks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"client_id" varchar,
	"contact_name" text NOT NULL,
	"contact_phone" text,
	"contact_email" text,
	"reason" text NOT NULL,
	"category" text DEFAULT 'general',
	"priority" text DEFAULT 'normal',
	"requested_date" text NOT NULL,
	"preferred_time" text,
	"assigned_to" text,
	"status" text DEFAULT 'pending',
	"attempt_count" integer DEFAULT 0,
	"last_attempt_date" text,
	"completed_date" text,
	"outcome" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capacity_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"period_type" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"total_available_hours" real DEFAULT 0,
	"scheduled_hours" real DEFAULT 0,
	"completed_hours" real DEFAULT 0,
	"utilization_percent" real DEFAULT 0,
	"staff_count" integer DEFAULT 0,
	"job_count" integer DEFAULT 0,
	"breakdown_by_staff" jsonb DEFAULT '[]'::jsonb,
	"breakdown_by_job_type" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"technician_id" varchar,
	"technician_name" text NOT NULL,
	"certification_type" text NOT NULL,
	"certification_name" text NOT NULL,
	"issuing_body" text,
	"certificate_number" text,
	"issue_date" text,
	"expiry_date" text,
	"certificate_file" text,
	"status" text DEFAULT 'valid',
	"reminder_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "check_sheet_readings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"template_id" varchar,
	"job_id" varchar,
	"project_id" varchar,
	"building" text,
	"floor" text,
	"location" text,
	"system_type" text NOT NULL,
	"system_id" text,
	"tester_name" text NOT NULL,
	"test_date" text NOT NULL,
	"test_time" text,
	"readings" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft',
	"overall_result" text,
	"pass_count" integer DEFAULT 0,
	"fail_count" integer DEFAULT 0,
	"na_count" integer DEFAULT 0,
	"notes" text,
	"recommendations" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"signature" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "check_sheet_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"system_type" text NOT NULL,
	"version" text DEFAULT '1.0',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"fields" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"company_name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"postcode" text,
	"city" text,
	"vat_number" text,
	"account_number" text,
	"payment_terms" integer DEFAULT 30,
	"priority" text DEFAULT 'standard',
	"notes" text,
	"client_type" text DEFAULT 'commercial',
	"status" text DEFAULT 'active',
	"portal_token" text,
	"portal_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "communication_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"type" text NOT NULL,
	"subject" text,
	"content" text NOT NULL,
	"contact_name" text,
	"direction" text DEFAULT 'outbound',
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" text,
	"follow_up_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"company_name" text NOT NULL,
	"trading_name" text,
	"website" text,
	"phone" text,
	"email" text,
	"address" text,
	"postcode" text,
	"region" text,
	"specializations" text,
	"market_position" text DEFAULT 'direct',
	"company_size" text DEFAULT 'unknown',
	"estimated_revenue" text,
	"employee_count" integer,
	"founded_year" integer,
	"accreditations" text,
	"key_strengths" text,
	"key_weaknesses" text,
	"pricing_level" text DEFAULT 'unknown',
	"average_quote_variance" real,
	"won_against" integer DEFAULT 0,
	"lost_to" integer DEFAULT 0,
	"last_encounter_date" text,
	"last_encounter_outcome" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"threat_level" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compliance_checklists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"test_id" varchar,
	"project_id" varchar,
	"inspection_type" text NOT NULL,
	"standard_reference" text DEFAULT 'BS EN 12101-8:2020',
	"checklist_items" jsonb DEFAULT '[]'::jsonb,
	"overall_compliant" boolean,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"contract_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"value" real,
	"billing_frequency" text DEFAULT 'annual',
	"start_date" text NOT NULL,
	"end_date" text,
	"renewal_date" text,
	"auto_renew" boolean DEFAULT false,
	"sla_level" text DEFAULT 'standard',
	"sla_response_time" integer,
	"sla_resolution_time" integer,
	"terms" text,
	"status" text DEFAULT 'active',
	"signed_by_client" boolean DEFAULT false,
	"signed_by_company" boolean DEFAULT false,
	"client_signature" text,
	"company_signature" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"address_type" text DEFAULT 'site',
	"address_name" text,
	"address" text NOT NULL,
	"city" text,
	"county" text,
	"postcode" text,
	"country" text DEFAULT 'United Kingdom',
	"is_primary" boolean DEFAULT false,
	"site_contact_name" text,
	"site_contact_phone" text,
	"access_notes" text,
	"parking_info" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"contact_name" text NOT NULL,
	"job_title" text,
	"department" text,
	"email" text,
	"phone" text,
	"mobile" text,
	"is_primary" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"feedback_date" text NOT NULL,
	"rating" integer NOT NULL,
	"category" text DEFAULT 'general',
	"feedback_type" text DEFAULT 'positive',
	"summary" text NOT NULL,
	"details" text,
	"action_taken" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" text,
	"follow_up_notes" text,
	"resolved_date" text,
	"staff_member" text,
	"source" text DEFAULT 'direct',
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_briefings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"briefing_date" text NOT NULL,
	"staff_id" varchar,
	"scheduled_jobs" jsonb DEFAULT '[]'::jsonb,
	"equipment_assigned" jsonb DEFAULT '[]'::jsonb,
	"vehicle_assigned" varchar,
	"special_instructions" text,
	"safety_reminders" text,
	"viewed_at" timestamp,
	"printed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "damper_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"damper_width" real NOT NULL,
	"damper_height" real NOT NULL,
	"system_type" text DEFAULT '',
	"location" text,
	"shaft_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dampers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"damper_key" text NOT NULL,
	"building" text NOT NULL,
	"location" text NOT NULL,
	"floor_number" text NOT NULL,
	"shaft_id" text NOT NULL,
	"description" text,
	"system_type" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "defects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"defect_number" text NOT NULL,
	"job_id" varchar,
	"client_id" varchar,
	"site_address" text,
	"location" text,
	"damper_ref" text,
	"category" text,
	"severity" text DEFAULT 'medium',
	"description" text NOT NULL,
	"discovered_date" text NOT NULL,
	"discovered_by" text,
	"status" text DEFAULT 'open',
	"resolution" text,
	"resolved_date" text,
	"resolved_by" text,
	"estimated_cost" real,
	"actual_cost" real,
	"quote_id" varchar,
	"remedial_job_id" varchar,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_register" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"document_number" text NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"document_type" text,
	"description" text,
	"version" text DEFAULT '1.0',
	"client_id" varchar,
	"job_id" varchar,
	"project_id" varchar,
	"issue_date" text,
	"expiry_date" text,
	"review_date" text,
	"status" text DEFAULT 'current',
	"file_reference" text,
	"issued_by" text,
	"approved_by" text,
	"tags" text[],
	"notes" text,
	"is_confidential" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"template_type" text DEFAULT 'quote',
	"category" text DEFAULT 'general',
	"content" text NOT NULL,
	"placeholders" jsonb DEFAULT '[]'::jsonb,
	"header_text" text,
	"footer_text" text,
	"terms_and_conditions" text,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"version" integer DEFAULT 1,
	"last_used_date" text,
	"usage_count" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text,
	"file_data" text,
	"content" jsonb,
	"version" integer DEFAULT 1,
	"expiry_date" text,
	"status" text DEFAULT 'draft',
	"signed_by" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"asset_tag" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'tool',
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"purchase_date" text,
	"purchase_price" real,
	"current_value" real,
	"calibration_due" text,
	"last_calibrated" text,
	"calibration_certificate" text,
	"maintenance_due" text,
	"last_maintenance" text,
	"assigned_to" varchar,
	"location" text,
	"status" text DEFAULT 'available',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"date" text NOT NULL,
	"mileage" real,
	"mileage_rate" real DEFAULT 0.45,
	"receipt_image" text,
	"reimbursable" boolean DEFAULT true,
	"reimbursed" boolean DEFAULT false,
	"reimbursed_at" timestamp,
	"approved_by" varchar,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "form_entities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_entity_rows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"component" text NOT NULL,
	"activity" text NOT NULL,
	"reference" text,
	"field_type" text NOT NULL,
	"units" text,
	"choices" jsonb,
	"evidence_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"site_id" varchar,
	"job_id" varchar,
	"form_type" text NOT NULL,
	"form_title" text NOT NULL,
	"reference_number" text,
	"form_data" jsonb NOT NULL,
	"linked_entity_type" text,
	"linked_entity_id" varchar,
	"status" text DEFAULT 'submitted',
	"submitted_by" text NOT NULL,
	"submitted_by_role" text,
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"signature" text,
	"signature_name" text,
	"signature_date" text,
	"pdf_url" text,
	"version" integer DEFAULT 1,
	"previous_version_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "form_template_entities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"repeat_per_asset" boolean DEFAULT false NOT NULL,
	"evidence_required" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_template_system_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"system_type_id" varchar NOT NULL,
	"organization_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"incident_date" text NOT NULL,
	"incident_time" text,
	"location" text NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'low',
	"description" text NOT NULL,
	"immediate_actions" text,
	"persons_involved" jsonb DEFAULT '[]'::jsonb,
	"witnesses" jsonb DEFAULT '[]'::jsonb,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"root_cause" text,
	"corrective_actions" text,
	"preventive_measures" text,
	"reported_to" text,
	"reported_at" timestamp,
	"investigated_by" text,
	"investigated_at" timestamp,
	"closed_by" text,
	"closed_at" timestamp,
	"status" text DEFAULT 'open',
	"riddor_reportable" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inspection_instances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"job_id" varchar NOT NULL,
	"system_type_id" varchar NOT NULL,
	"template_id" varchar NOT NULL,
	"created_by_user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"completed_by_user_id" varchar
);
--> statement-breakpoint
CREATE TABLE "inspection_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"inspection_id" varchar NOT NULL,
	"row_id" varchar NOT NULL,
	"value_text" text,
	"value_number" text,
	"value_bool" boolean,
	"comment" text,
	"created_by_user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"item_name" text NOT NULL,
	"part_number" text,
	"description" text,
	"category" text,
	"supplier_id" varchar,
	"location" text,
	"quantity_in_stock" integer DEFAULT 0,
	"minimum_stock" integer DEFAULT 0,
	"reorder_point" integer DEFAULT 0,
	"reorder_quantity" integer,
	"unit_cost" real,
	"sell_price" real,
	"unit" text DEFAULT 'each',
	"last_purchase_date" text,
	"last_stock_check" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"contract_id" varchar,
	"quote_id" varchar,
	"invoice_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" real,
	"vat_rate" real DEFAULT 20,
	"vat_amount" real,
	"total" real,
	"due_date" text,
	"terms" text,
	"status" text DEFAULT 'draft',
	"stripe_payment_intent_id" text,
	"stripe_invoice_id" text,
	"paid_amount" real DEFAULT 0,
	"paid_at" timestamp,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar NOT NULL,
	"staff_id" varchar,
	"subcontractor_id" varchar,
	"role" text DEFAULT 'technician',
	"assigned_date" text,
	"start_time" text,
	"end_time" text,
	"status" text DEFAULT 'assigned',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_checklists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"template_id" varchar,
	"items" jsonb DEFAULT '[]'::jsonb,
	"completed_count" integer DEFAULT 0,
	"total_count" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_equipment_reservations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar NOT NULL,
	"equipment_id" varchar NOT NULL,
	"reserved_date" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"status" text DEFAULT 'reserved',
	"checked_out_by" varchar,
	"checked_out_at" timestamp,
	"returned_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_parts_used" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar NOT NULL,
	"part_id" varchar,
	"site_asset_id" varchar,
	"part_number" text,
	"part_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" real,
	"total_cost" real,
	"source" text DEFAULT 'stock',
	"supplier" text,
	"serial_number" text,
	"batch_number" text,
	"warranty_months" integer,
	"install_location" text,
	"notes" text,
	"added_by" varchar,
	"added_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_site_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar NOT NULL,
	"site_asset_id" varchar NOT NULL,
	"status" text DEFAULT 'assigned',
	"assigned_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"completed_by" varchar,
	"notes" text,
	"test_results" jsonb,
	"requires_work" boolean DEFAULT false,
	"requires_work_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_skill_requirements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar NOT NULL,
	"skill_type" text NOT NULL,
	"skill_level" text DEFAULT 'required',
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"job_type" text DEFAULT 'testing',
	"estimated_duration" real,
	"default_price" real,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"equipment_required" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_time_windows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar NOT NULL,
	"preferred_date" text,
	"preferred_time_start" text,
	"preferred_time_end" text,
	"alternate_date" text,
	"alternate_time_start" text,
	"alternate_time_end" text,
	"customer_notes" text,
	"access_restrictions" text,
	"estimated_arrival_window" text,
	"confirmation_status" text DEFAULT 'pending',
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"contract_id" varchar,
	"project_id" varchar,
	"site_id" varchar,
	"job_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"site_address" text,
	"scheduled_date" text,
	"scheduled_time" text,
	"estimated_duration" real,
	"actual_duration" real,
	"estimated_travel_time" real,
	"actual_travel_time" real,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"assigned_technician_id" varchar,
	"assigned_subcontractor_id" varchar,
	"priority" text DEFAULT 'normal',
	"status" text DEFAULT 'pending',
	"job_type" text DEFAULT 'testing',
	"worksheet_type" text DEFAULT 'routine_service',
	"engineer_count" integer DEFAULT 1,
	"engineer_names" jsonb DEFAULT '[]'::jsonb,
	"quoted_amount" real,
	"actual_cost" real,
	"materials_cost" real,
	"labour_cost" real,
	"profit_margin" real,
	"notes" text,
	"completion_notes" text,
	"customer_signature" text,
	"system_age" text,
	"system_install_date" text,
	"system_condition" text DEFAULT 'operational',
	"fault_history" jsonb DEFAULT '[]'::jsonb,
	"recommendations" text,
	"back_office_notes" text,
	"service_statement" text,
	"systems" jsonb DEFAULT '[]'::jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"company_name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"source" text,
	"estimated_value" real,
	"probability" integer,
	"stage" text DEFAULT 'new',
	"assigned_to" varchar,
	"next_follow_up" text,
	"notes" text,
	"lost_reason" text,
	"converted_to_client_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "location_coordinates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"address" text,
	"postcode" text,
	"geocoded_at" timestamp DEFAULT now(),
	"source" text DEFAULT 'manual',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mileage_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"vehicle_id" varchar,
	"claim_date" text NOT NULL,
	"start_location" text NOT NULL,
	"end_location" text NOT NULL,
	"purpose" text,
	"distance_miles" real NOT NULL,
	"rate_per_mile" real DEFAULT 0.45,
	"total_amount" real,
	"is_business_miles" boolean DEFAULT true,
	"vehicle_type" text DEFAULT 'car',
	"passenger_count" integer DEFAULT 0,
	"passenger_rate" real DEFAULT 0.05,
	"status" text DEFAULT 'pending',
	"approved_by" text,
	"approved_date" text,
	"paid_date" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info',
	"category" text,
	"entity_type" text,
	"entity_id" varchar,
	"read" boolean DEFAULT false,
	"read_at" timestamp,
	"action_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'engineer',
	"token" text NOT NULL,
	"invited_by" varchar,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"owner_id" varchar,
	"logo_url" text,
	"address" text,
	"phone" text,
	"email" text,
	"website" text,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "parts_catalog" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"supplier_id" varchar,
	"part_number" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general',
	"manufacturer" text,
	"model_number" text,
	"unit_of_measure" text DEFAULT 'each',
	"cost_price" real NOT NULL,
	"sell_price" real,
	"markup_percent" real,
	"stock_quantity" integer DEFAULT 0,
	"minimum_stock" integer DEFAULT 0,
	"reorder_quantity" integer,
	"lead_time_days" integer,
	"location" text,
	"barcode" text,
	"weight" real,
	"dimensions" text,
	"compatible_with" text,
	"alternative_parts" text,
	"warranty_months" integer,
	"is_active" boolean DEFAULT true,
	"last_order_date" text,
	"last_price_update" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"metric_date" text NOT NULL,
	"metric_type" text NOT NULL,
	"value" real NOT NULL,
	"target" real,
	"technician_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "price_lists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"code" text,
	"category" text DEFAULT 'service',
	"description" text,
	"unit" text DEFAULT 'each',
	"cost_price" real,
	"sell_price" real NOT NULL,
	"margin_percent" real,
	"vat_rate" real DEFAULT 20,
	"vat_included" boolean DEFAULT false,
	"minimum_charge" real,
	"discountable" boolean DEFAULT true,
	"max_discount_percent" real,
	"effective_from" text,
	"effective_to" text,
	"supplier_ref" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"site_address" text NOT NULL,
	"site_postcode" text,
	"client_name" text NOT NULL,
	"main_contractor" text,
	"buildings" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"supplier_id" varchar,
	"po_number" text NOT NULL,
	"order_date" text NOT NULL,
	"expected_delivery_date" text,
	"actual_delivery_date" text,
	"status" text DEFAULT 'draft',
	"items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" real DEFAULT 0,
	"vat_rate" real DEFAULT 20,
	"vat_amount" real DEFAULT 0,
	"total_amount" real DEFAULT 0,
	"shipping_address" text,
	"notes" text,
	"internal_notes" text,
	"job_id" varchar,
	"approved_by" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quality_checklists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"name" text NOT NULL,
	"checklist_type" text DEFAULT 'pre_work',
	"category" text DEFAULT 'general',
	"completed_by" text,
	"completed_date" text,
	"status" text DEFAULT 'pending',
	"items" jsonb DEFAULT '[]'::jsonb,
	"overall_score" integer,
	"pass_threshold" integer DEFAULT 80,
	"is_passed" boolean,
	"supervisor_approval" text,
	"supervisor_date" text,
	"non_conformances" text,
	"corrective_actions" text,
	"attachments" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"quote_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"subtotal" real,
	"vat_rate" real DEFAULT 20,
	"vat_amount" real,
	"total" real,
	"valid_until" text,
	"terms" text,
	"status" text DEFAULT 'draft',
	"sent_at" timestamp,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recurring_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"template_id" varchar,
	"client_id" varchar,
	"contract_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"service_type" text,
	"frequency" text NOT NULL,
	"interval" integer DEFAULT 1,
	"day_of_week" integer,
	"day_of_month" integer,
	"month_of_year" integer,
	"start_date" text NOT NULL,
	"end_date" text,
	"next_due_date" text,
	"last_generated_date" text,
	"site_address" text,
	"assigned_technician" text,
	"priority" text DEFAULT 'medium',
	"auto_create_days" integer DEFAULT 14,
	"reminder_days_before" integer DEFAULT 7,
	"last_reminder_sent" text,
	"is_active" boolean DEFAULT true,
	"jobs_generated" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recurring_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"contract_id" varchar,
	"template_id" varchar,
	"title" text NOT NULL,
	"frequency" text NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"month_of_year" integer,
	"start_date" text NOT NULL,
	"end_date" text,
	"next_run_date" text,
	"last_run_date" text,
	"auto_create" boolean DEFAULT true,
	"advance_notice_days" integer DEFAULT 7,
	"site_address" text,
	"assigned_to" varchar,
	"notes" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"reminder_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'pending',
	"sent_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"title" text NOT NULL,
	"site_address" text,
	"assessment_date" text,
	"assessed_by" text,
	"review_date" text,
	"hazards" jsonb DEFAULT '[]'::jsonb,
	"method_statement" text,
	"ppe" jsonb DEFAULT '[]'::jsonb,
	"emergency_procedures" text,
	"signatures" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduling_conflicts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"conflict_type" text NOT NULL,
	"job1_id" varchar,
	"job2_id" varchar,
	"resource_type" text,
	"resource_id" varchar,
	"conflict_date" text NOT NULL,
	"conflict_details" text,
	"severity" text DEFAULT 'warning',
	"status" text DEFAULT 'unresolved',
	"resolved_by" varchar,
	"resolved_at" timestamp,
	"resolution" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"equipment_id" text,
	"service_date" text NOT NULL,
	"service_type" text DEFAULT 'maintenance',
	"technician_name" text,
	"description" text NOT NULL,
	"work_performed" text,
	"parts_used" text,
	"parts_cost" real,
	"labour_hours" real,
	"labour_cost" real,
	"total_cost" real,
	"outcome" text DEFAULT 'completed',
	"next_service_due" text,
	"recommendations" text,
	"customer_signature" text,
	"signed_date" text,
	"document_path" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_level_agreements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"contract_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'standard',
	"response_time_hours" integer NOT NULL,
	"resolution_time_hours" integer,
	"escalation_level1_hours" integer,
	"escalation_level1_contact" text,
	"escalation_level2_hours" integer,
	"escalation_level2_contact" text,
	"escalation_level3_hours" integer,
	"escalation_level3_contact" text,
	"service_hours" text DEFAULT 'business',
	"business_hours_start" text,
	"business_hours_end" text,
	"exclude_weekends" boolean DEFAULT true,
	"exclude_holidays" boolean DEFAULT true,
	"penalty_clause" text,
	"penalty_amount" real,
	"is_active" boolean DEFAULT true,
	"effective_from" text,
	"effective_to" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"contract_id" varchar,
	"project_id" varchar,
	"asset_id" varchar,
	"reminder_type" text NOT NULL,
	"due_date" text NOT NULL,
	"last_service_date" text,
	"frequency" text DEFAULT 'annual',
	"frequency_months" integer DEFAULT 12,
	"reminder_lead_days" integer DEFAULT 30,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'normal',
	"scheduled_job_id" varchar,
	"notes" text,
	"auto_schedule" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"visit_type_id" varchar,
	"name" text NOT NULL,
	"interval_type" text NOT NULL,
	"carried_out_by" text DEFAULT 'competent_person',
	"checklist_items" jsonb DEFAULT '[]'::jsonb,
	"guidelines" text,
	"equipment_required" text,
	"estimated_duration" integer,
	"regulatory_reference" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_handovers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"handover_date" text NOT NULL,
	"outgoing_staff_id" varchar,
	"incoming_staff_id" varchar,
	"pending_jobs" jsonb DEFAULT '[]'::jsonb,
	"completed_jobs" jsonb DEFAULT '[]'::jsonb,
	"issues_raised" text,
	"equipment_notes" text,
	"safety_alerts" text,
	"general_notes" text,
	"acknowledged_at" timestamp,
	"acknowledged_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_access_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"site_name" text NOT NULL,
	"site_address" text,
	"parking_instructions" text,
	"access_code" text,
	"key_safe_location" text,
	"key_safe_code" text,
	"building_manager_name" text,
	"building_manager_phone" text,
	"security_contact" text,
	"access_hours" text,
	"special_requirements" text,
	"induction_required" boolean DEFAULT false,
	"induction_notes" text,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"project_id" varchar,
	"client_id" varchar,
	"site_id" varchar,
	"asset_number" text NOT NULL,
	"asset_type" text NOT NULL,
	"visit_type" text,
	"building" text,
	"floor" text,
	"area" text,
	"location" text,
	"description" text,
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"install_date" text,
	"warranty_expiry" text,
	"dimensions" jsonb,
	"specifications" jsonb,
	"status" text DEFAULT 'active',
	"last_inspection_date" text,
	"next_inspection_due" text,
	"condition" text DEFAULT 'good',
	"photos" jsonb DEFAULT '[]'::jsonb,
	"qr_code" text,
	"parent_asset_id" varchar,
	"batch_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"postcode" text,
	"city" text,
	"system_type" text,
	"system_description" text,
	"access_notes" text,
	"parking_info" text,
	"site_contact_name" text,
	"site_contact_phone" text,
	"site_contact_email" text,
	"notes" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"staff_id" varchar NOT NULL,
	"day_of_week" integer,
	"specific_date" text,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"availability_type" text DEFAULT 'available',
	"is_recurring" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff_directory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"employee_number" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"mobile" text,
	"job_title" text,
	"department" text,
	"start_date" text,
	"end_date" text,
	"employment_type" text DEFAULT 'full_time',
	"line_manager" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"address" text,
	"postcode" text,
	"ni_number" text,
	"driving_licence" boolean DEFAULT false,
	"driving_licence_expiry" text,
	"skills" text[],
	"qualifications" text[],
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stairwell_tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"test_date" text NOT NULL,
	"test_time" text,
	"tester_name" text NOT NULL,
	"building" text NOT NULL,
	"stairwell_id" text NOT NULL,
	"stairwell_location" text,
	"system_type" text DEFAULT '',
	"system_description" text,
	"standard_version" text DEFAULT 'bs_en_12101_6_2022',
	"applicable_standards" jsonb DEFAULT '["BS EN 12101-6"]'::jsonb,
	"scenario" text DEFAULT '',
	"scenario_description" text,
	"fan_running" boolean DEFAULT true,
	"fan_speed" real,
	"fan_speed_unit" text DEFAULT '',
	"damper_states" text,
	"level_measurements" jsonb DEFAULT '[]'::jsonb,
	"average_differential" real,
	"min_differential" real,
	"max_differential" real,
	"average_door_force" real,
	"max_door_force" real,
	"overall_pressure_compliant" boolean,
	"overall_force_compliant" boolean,
	"overall_compliant" boolean,
	"ambient_temperature" real,
	"wind_conditions" text DEFAULT '',
	"notes" text,
	"recommendations" text,
	"report_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subcontractors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"company_name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"specializations" jsonb DEFAULT '[]'::jsonb,
	"hourly_rate" real,
	"day_rate" real,
	"insurance_expiry" text,
	"certifications" jsonb DEFAULT '[]'::jsonb,
	"rating" real,
	"status" text DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"postcode" text,
	"website" text,
	"category" text,
	"account_number" text,
	"payment_terms" text,
	"tax_id" text,
	"rating" integer,
	"notes" text,
	"is_preferred" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"sent_at" timestamp,
	"completed_at" timestamp,
	"overall_rating" integer,
	"quality_rating" integer,
	"timeliness_rating" integer,
	"communication_rating" integer,
	"value_rating" integer,
	"would_recommend" boolean,
	"feedback" text,
	"follow_up_required" boolean DEFAULT false,
	"follow_up_notes" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"entity_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"action" text NOT NULL,
	"data" jsonb,
	"synced" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" varchar NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'engineer',
	"job_title" text,
	"department" text,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending',
	"expires_at" timestamp,
	"accepted_at" timestamp,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tenders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"tender_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"issuer" text,
	"received_date" text,
	"submission_deadline" text,
	"contract_value" real,
	"contract_duration" text,
	"bid_amount" real,
	"bid_submitted_date" text,
	"competitors" jsonb DEFAULT '[]'::jsonb,
	"win_probability" integer,
	"documents" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'received',
	"outcome" text,
	"debrief_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_packs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"description" text,
	"building_type" text,
	"floors" integer NOT NULL,
	"dampers_per_floor" integer NOT NULL,
	"damper_config" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "test_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"project_id" varchar,
	"name" text NOT NULL,
	"building" text NOT NULL,
	"status" text DEFAULT 'pending',
	"current_index" integer DEFAULT 0,
	"damper_sequence" jsonb DEFAULT '[]'::jsonb,
	"total_dampers" integer DEFAULT 0,
	"completed_dampers" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"damper_id" varchar,
	"test_date" text NOT NULL,
	"building" text NOT NULL,
	"location" text NOT NULL,
	"floor_number" text NOT NULL,
	"shaft_id" text NOT NULL,
	"system_type" text DEFAULT '',
	"tester_name" text NOT NULL,
	"notes" text DEFAULT '',
	"readings" jsonb NOT NULL,
	"grid_size" integer,
	"average" real NOT NULL,
	"damper_width" real,
	"damper_height" real,
	"free_area" real,
	"damper_open_image" text,
	"damper_closed_image" text,
	"report_id" varchar,
	"visit_type" text,
	"failure_reason_code" text,
	"failure_narrative" text,
	"corrective_action" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_off_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"employee_name" text NOT NULL,
	"employee_id" text,
	"request_type" text DEFAULT 'annual_leave',
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"total_days" real NOT NULL,
	"is_half_day" boolean DEFAULT false,
	"half_day_period" text,
	"reason" text,
	"status" text DEFAULT 'pending',
	"approved_by" text,
	"approved_date" text,
	"rejection_reason" text,
	"cover_arrangements" text,
	"emergency_contact" text,
	"emergency_phone" text,
	"affects_projects" text,
	"handover_notes" text,
	"return_confirmed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"technician_id" varchar,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text,
	"break_duration" real DEFAULT 0,
	"total_hours" real,
	"hourly_rate" real,
	"overtime_hours" real DEFAULT 0,
	"overtime_rate" real,
	"description" text,
	"status" text DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "training_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"employee_name" text NOT NULL,
	"employee_id" text,
	"course_name" text NOT NULL,
	"course_type" text,
	"provider" text,
	"completed_date" text,
	"expiry_date" text,
	"certificate_number" text,
	"status" text DEFAULT 'scheduled',
	"score" real,
	"passing_score" real,
	"duration" text,
	"cost" real,
	"reimbursed" boolean DEFAULT false,
	"notes" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"username" text,
	"password" text,
	"display_name" text,
	"company_name" text,
	"role" text DEFAULT 'field_engineer',
	"organization_id" varchar,
	"organization_role" text DEFAULT 'engineer',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vehicle_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"vehicle_id" varchar,
	"job_id" varchar,
	"technician_id" varchar,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"start_mileage" real,
	"end_mileage" real,
	"purpose" text,
	"status" text DEFAULT 'confirmed',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"registration" text NOT NULL,
	"make" text,
	"model" text,
	"year" integer,
	"color" text,
	"mileage" real,
	"fuel_type" text DEFAULT 'diesel',
	"insurance_expiry" text,
	"mot_expiry" text,
	"service_date" text,
	"next_service_date" text,
	"status" text DEFAULT 'available',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "visit_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'smoke_control',
	"inspection_intervals" jsonb DEFAULT '{"daily":true,"weekly":true,"monthly":true,"quarterly":true,"biannual":true,"annual":true}'::jsonb,
	"regulatory_standard" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warranties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"client_id" varchar,
	"job_id" varchar,
	"equipment_description" text NOT NULL,
	"manufacturer" text,
	"model_number" text,
	"serial_number" text,
	"installation_date" text NOT NULL,
	"warranty_start_date" text NOT NULL,
	"warranty_end_date" text NOT NULL,
	"warranty_type" text DEFAULT 'standard',
	"warranty_provider" text,
	"coverage_details" text,
	"exclusions" text,
	"claim_process" text,
	"contact_phone" text,
	"contact_email" text,
	"reference_number" text,
	"purchase_price" real,
	"warranty_cost" real,
	"claims_count" integer DEFAULT 0,
	"last_claim_date" text,
	"status" text DEFAULT 'active',
	"document_path" text,
	"reminder_days" integer DEFAULT 30,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"job_id" varchar,
	"client_id" varchar,
	"note_date" text NOT NULL,
	"note_type" text DEFAULT 'general',
	"subject" text,
	"content" text NOT NULL,
	"author_name" text,
	"contact_person" text,
	"is_internal" boolean DEFAULT false,
	"priority" text DEFAULT 'normal',
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" text,
	"follow_up_completed" boolean DEFAULT false,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_batches" ADD CONSTRAINT "asset_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_batches" ADD CONSTRAINT "asset_batches_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callbacks" ADD CONSTRAINT "callbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callbacks" ADD CONSTRAINT "callbacks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "callbacks" ADD CONSTRAINT "callbacks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_snapshots" ADD CONSTRAINT "capacity_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_sheet_readings" ADD CONSTRAINT "check_sheet_readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_sheet_readings" ADD CONSTRAINT "check_sheet_readings_template_id_check_sheet_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."check_sheet_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_sheet_readings" ADD CONSTRAINT "check_sheet_readings_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_sheet_readings" ADD CONSTRAINT "check_sheet_readings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_sheet_templates" ADD CONSTRAINT "check_sheet_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_checklists" ADD CONSTRAINT "compliance_checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_checklists" ADD CONSTRAINT "compliance_checklists_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_checklists" ADD CONSTRAINT "compliance_checklists_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_briefings" ADD CONSTRAINT "daily_briefings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_briefings" ADD CONSTRAINT "daily_briefings_staff_id_staff_directory_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damper_templates" ADD CONSTRAINT "damper_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dampers" ADD CONSTRAINT "dampers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defects" ADD CONSTRAINT "defects_remedial_job_id_jobs_id_fk" FOREIGN KEY ("remedial_job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_register" ADD CONSTRAINT "document_register_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_entities" ADD CONSTRAINT "form_entities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_entity_rows" ADD CONSTRAINT "form_entity_rows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_entity_rows" ADD CONSTRAINT "form_entity_rows_entity_id_form_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."form_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_entities" ADD CONSTRAINT "form_template_entities_template_id_form_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_entities" ADD CONSTRAINT "form_template_entities_entity_id_form_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."form_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_entities" ADD CONSTRAINT "form_template_entities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_system_types" ADD CONSTRAINT "form_template_system_types_template_id_form_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_system_types" ADD CONSTRAINT "form_template_system_types_system_type_id_system_types_id_fk" FOREIGN KEY ("system_type_id") REFERENCES "public"."system_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_system_types" ADD CONSTRAINT "form_template_system_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_instances" ADD CONSTRAINT "inspection_instances_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_instances" ADD CONSTRAINT "inspection_instances_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_instances" ADD CONSTRAINT "inspection_instances_system_type_id_system_types_id_fk" FOREIGN KEY ("system_type_id") REFERENCES "public"."system_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_instances" ADD CONSTRAINT "inspection_instances_template_id_form_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."form_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_instances" ADD CONSTRAINT "inspection_instances_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_instances" ADD CONSTRAINT "inspection_instances_completed_by_user_id_users_id_fk" FOREIGN KEY ("completed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_responses" ADD CONSTRAINT "inspection_responses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_responses" ADD CONSTRAINT "inspection_responses_inspection_id_inspection_instances_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspection_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_responses" ADD CONSTRAINT "inspection_responses_row_id_form_entity_rows_id_fk" FOREIGN KEY ("row_id") REFERENCES "public"."form_entity_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_responses" ADD CONSTRAINT "inspection_responses_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_staff_id_staff_directory_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_subcontractor_id_subcontractors_id_fk" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_checklists" ADD CONSTRAINT "job_checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_checklists" ADD CONSTRAINT "job_checklists_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_checklists" ADD CONSTRAINT "job_checklists_template_id_job_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."job_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_equipment_reservations" ADD CONSTRAINT "job_equipment_reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_equipment_reservations" ADD CONSTRAINT "job_equipment_reservations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_equipment_reservations" ADD CONSTRAINT "job_equipment_reservations_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_used" ADD CONSTRAINT "job_parts_used_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_used" ADD CONSTRAINT "job_parts_used_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_used" ADD CONSTRAINT "job_parts_used_part_id_parts_catalog_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_used" ADD CONSTRAINT "job_parts_used_site_asset_id_site_assets_id_fk" FOREIGN KEY ("site_asset_id") REFERENCES "public"."site_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_parts_used" ADD CONSTRAINT "job_parts_used_added_by_staff_directory_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."staff_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_site_assets" ADD CONSTRAINT "job_site_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_site_assets" ADD CONSTRAINT "job_site_assets_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_site_assets" ADD CONSTRAINT "job_site_assets_site_asset_id_site_assets_id_fk" FOREIGN KEY ("site_asset_id") REFERENCES "public"."site_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_skill_requirements" ADD CONSTRAINT "job_skill_requirements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_skill_requirements" ADD CONSTRAINT "job_skill_requirements_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_templates" ADD CONSTRAINT "job_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_time_windows" ADD CONSTRAINT "job_time_windows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_time_windows" ADD CONSTRAINT "job_time_windows_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_coordinates" ADD CONSTRAINT "location_coordinates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mileage_claims" ADD CONSTRAINT "mileage_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mileage_claims" ADD CONSTRAINT "mileage_claims_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mileage_claims" ADD CONSTRAINT "mileage_claims_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_catalog" ADD CONSTRAINT "parts_catalog_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_catalog" ADD CONSTRAINT "parts_catalog_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_lists" ADD CONSTRAINT "price_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checklists" ADD CONSTRAINT "quality_checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_checklists" ADD CONSTRAINT "quality_checklists_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_jobs" ADD CONSTRAINT "recurring_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_jobs" ADD CONSTRAINT "recurring_jobs_template_id_job_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."job_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_jobs" ADD CONSTRAINT "recurring_jobs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_jobs" ADD CONSTRAINT "recurring_jobs_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_schedules" ADD CONSTRAINT "recurring_schedules_template_id_job_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."job_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_conflicts" ADD CONSTRAINT "scheduling_conflicts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_conflicts" ADD CONSTRAINT "scheduling_conflicts_job1_id_jobs_id_fk" FOREIGN KEY ("job1_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduling_conflicts" ADD CONSTRAINT "scheduling_conflicts_job2_id_jobs_id_fk" FOREIGN KEY ("job2_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_level_agreements" ADD CONSTRAINT "service_level_agreements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_level_agreements" ADD CONSTRAINT "service_level_agreements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_level_agreements" ADD CONSTRAINT "service_level_agreements_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_asset_id_site_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."site_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_reminders" ADD CONSTRAINT "service_reminders_scheduled_job_id_jobs_id_fk" FOREIGN KEY ("scheduled_job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_templates" ADD CONSTRAINT "service_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_templates" ADD CONSTRAINT "service_templates_visit_type_id_visit_types_id_fk" FOREIGN KEY ("visit_type_id") REFERENCES "public"."visit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_outgoing_staff_id_staff_directory_id_fk" FOREIGN KEY ("outgoing_staff_id") REFERENCES "public"."staff_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_incoming_staff_id_staff_directory_id_fk" FOREIGN KEY ("incoming_staff_id") REFERENCES "public"."staff_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_access_notes" ADD CONSTRAINT "site_access_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_access_notes" ADD CONSTRAINT "site_access_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_assets" ADD CONSTRAINT "site_assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_assets" ADD CONSTRAINT "site_assets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_assets" ADD CONSTRAINT "site_assets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_assets" ADD CONSTRAINT "site_assets_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_availability" ADD CONSTRAINT "staff_availability_staff_id_staff_directory_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff_directory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_directory" ADD CONSTRAINT "staff_directory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stairwell_tests" ADD CONSTRAINT "stairwell_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcontractors" ADD CONSTRAINT "subcontractors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_types" ADD CONSTRAINT "system_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_packs" ADD CONSTRAINT "test_packs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_sessions" ADD CONSTRAINT "test_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_damper_id_dampers_id_fk" FOREIGN KEY ("damper_id") REFERENCES "public"."dampers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_bookings" ADD CONSTRAINT "vehicle_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_bookings" ADD CONSTRAINT "vehicle_bookings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_bookings" ADD CONSTRAINT "vehicle_bookings_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_types" ADD CONSTRAINT "visit_types_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_notes" ADD CONSTRAINT "work_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_notes" ADD CONSTRAINT "work_notes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_notes" ADD CONSTRAINT "work_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_entities_org_idx" ON "form_entities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "form_entity_rows_entity_idx" ON "form_entity_rows" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "form_entity_rows_org_idx" ON "form_entity_rows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "form_template_entities_template_idx" ON "form_template_entities" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "form_template_entities_org_idx" ON "form_template_entities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "form_template_system_types_system_idx" ON "form_template_system_types" USING btree ("system_type_id");--> statement-breakpoint
CREATE INDEX "form_template_system_types_org_idx" ON "form_template_system_types" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "form_templates_org_idx" ON "form_templates" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "inspection_instances_job_idx" ON "inspection_instances" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "inspection_instances_org_idx" ON "inspection_instances" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "inspection_responses_insp_idx" ON "inspection_responses" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "inspection_responses_insp_row_idx" ON "inspection_responses" USING btree ("inspection_id","row_id");--> statement-breakpoint
CREATE INDEX "inspection_responses_org_idx" ON "inspection_responses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "system_types_org_code_idx" ON "system_types" USING btree ("organization_id","code");