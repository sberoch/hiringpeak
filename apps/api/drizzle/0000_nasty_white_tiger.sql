CREATE TYPE "public"."companyStatus" AS ENUM('Active', 'Prospect');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('END_USER', 'INTERNAL_USER');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"organization_id" integer NOT NULL,
	"actor_user_id" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"area_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_candidate_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"file_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"industry_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_seniorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"seniority_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"date_of_birth" date,
	"gender" text,
	"short_description" text,
	"email" text NOT NULL,
	"linkedin" text,
	"address" text,
	"phone" text,
	"deleted" boolean DEFAULT false,
	"source_id" integer,
	"stars" numeric,
	"is_in_company_via_pratt" boolean,
	"countries" text[] DEFAULT '{}',
	"provinces" text[] DEFAULT '{}',
	"languages" text[] DEFAULT '{}',
	"organization_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "candidates_name_organization_id_unique" UNIQUE("name","organization_id")
);
--> statement-breakpoint
CREATE TABLE "candidate_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_vacancies" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"vacancy_id" integer NOT NULL,
	"candidate_vacancy_status_id" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_vacancy_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort" integer NOT NULL,
	"is_initial" boolean NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"status" "companyStatus" NOT NULL,
	"client_name" text,
	"client_email" text,
	"client_phone" text,
	"organization_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"name" text NOT NULL,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seniorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true,
	"user_type" "user_type" DEFAULT 'END_USER' NOT NULL,
	"organization_id" integer,
	"role_id" integer,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_organization_id_unique" UNIQUE("email","organization_id")
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status_id" integer,
	"vacancy_filters_id" integer,
	"company_id" integer,
	"created_by" integer NOT NULL,
	"assigned_to" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancy_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"min_stars" numeric,
	"gender" text,
	"min_age" integer,
	"max_age" integer,
	"countries" text[],
	"provinces" text[],
	"languages" text[],
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancy_filters_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"vacancy_filters_id" integer NOT NULL,
	"area_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancy_filters_industries" (
	"id" serial PRIMARY KEY NOT NULL,
	"vacancy_filters_id" integer NOT NULL,
	"industry_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancy_filters_seniorities" (
	"id" serial PRIMARY KEY NOT NULL,
	"vacancy_filters_id" integer NOT NULL,
	"seniority_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacancy_statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklists" ADD CONSTRAINT "blacklists_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklists" ADD CONSTRAINT "blacklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklists" ADD CONSTRAINT "blacklists_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_areas" ADD CONSTRAINT "candidate_areas_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_areas" ADD CONSTRAINT "candidate_areas_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_candidate_files" ADD CONSTRAINT "candidate_candidate_files_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_candidate_files" ADD CONSTRAINT "candidate_candidate_files_file_id_candidate_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."candidate_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_industries" ADD CONSTRAINT "candidate_industries_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_industries" ADD CONSTRAINT "candidate_industries_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_seniorities" ADD CONSTRAINT "candidate_seniorities_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_seniorities" ADD CONSTRAINT "candidate_seniorities_seniority_id_seniorities_id_fk" FOREIGN KEY ("seniority_id") REFERENCES "public"."seniorities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_source_id_candidate_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."candidate_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_files" ADD CONSTRAINT "candidate_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_sources" ADD CONSTRAINT "candidate_sources_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vacancies" ADD CONSTRAINT "candidate_vacancies_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vacancies" ADD CONSTRAINT "candidate_vacancies_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vacancies" ADD CONSTRAINT "candidate_vacancies_candidate_vacancy_status_id_candidate_vacancy_statuses_id_fk" FOREIGN KEY ("candidate_vacancy_status_id") REFERENCES "public"."candidate_vacancy_statuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vacancies" ADD CONSTRAINT "candidate_vacancies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_vacancy_statuses" ADD CONSTRAINT "candidate_vacancy_statuses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "industries" ADD CONSTRAINT "industries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seniorities" ADD CONSTRAINT "seniorities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_status_id_vacancy_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."vacancy_statuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_vacancy_filters_id_vacancy_filters_id_fk" FOREIGN KEY ("vacancy_filters_id") REFERENCES "public"."vacancy_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters" ADD CONSTRAINT "vacancy_filters_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters_areas" ADD CONSTRAINT "vacancy_filters_areas_vacancy_filters_id_vacancy_filters_id_fk" FOREIGN KEY ("vacancy_filters_id") REFERENCES "public"."vacancy_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters_areas" ADD CONSTRAINT "vacancy_filters_areas_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters_industries" ADD CONSTRAINT "vacancy_filters_industries_vacancy_filters_id_vacancy_filters_id_fk" FOREIGN KEY ("vacancy_filters_id") REFERENCES "public"."vacancy_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters_industries" ADD CONSTRAINT "vacancy_filters_industries_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters_seniorities" ADD CONSTRAINT "vacancy_filters_seniorities_vacancy_filters_id_vacancy_filters_id_fk" FOREIGN KEY ("vacancy_filters_id") REFERENCES "public"."vacancy_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_filters_seniorities" ADD CONSTRAINT "vacancy_filters_seniorities_seniority_id_seniorities_id_fk" FOREIGN KEY ("seniority_id") REFERENCES "public"."seniorities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_statuses" ADD CONSTRAINT "vacancy_statuses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;