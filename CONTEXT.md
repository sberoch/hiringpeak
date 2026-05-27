# HiringPeak

A multi-tenant ATS (applicant tracking system) for executive-search recruiting agencies. Each tenant ("Organization") manages its client companies, the vacancies those clients are hiring for, and a curated pool of sourced candidates moving through a per-organization configurable pipeline.

Executive search shapes the design: low-volume, high-touch, candidates are *sourced* by recruiters rather than self-applying, qualitative judgement matters (e.g. star ratings), and the deliverable is often a written shortlist (per-vacancy / per-company PDF reports).

## Language

**Organization**:
An executive-search firm operating on the platform; the tenant boundary and the unit of paid subscription (one Organization == one paying customer). All domain data — candidates, vacancies, client companies, pipeline stages, users, audit records — belongs to exactly one Organization and is never shared across them.
_Avoid_: Tenant, Account, Workspace, Agency, Firm.

**Company**:
A client of an **Organization** — an external firm that has engaged the executive-search agency to fill one or more **Vacancies**. A Company is *not* a tenant: it has no login and never accesses the platform directly; the Organization's recruiters interact with it on its behalf.
_Avoid_: Client, Account, Customer, Employer.

**Client Contact** (embedded in Company as `clientName` / `clientEmail` / `clientPhone`):
The named person at the **Company** who serves as the Organization's point of contact for the engagement. Not a separate entity; not a platform user.
_Avoid_: Hiring manager, Sponsor.

**Company Status** (`Active` | `Prospect`):
A lightweight CRM-style state on a **Company**. `Prospect` = the Organization is pitching the Company but has no signed engagement yet; `Active` = the Organization has a signed engagement and is actively running searches for them. There is no explicit "lost" or "churned" state today.

**Vacancy**:
A specific role a **Company** has engaged the **Organization** to fill — the unit of search work. Has a configurable **Vacancy Status**, an assigned recruiter, a free-form description, optional structured **Vacancy Filters** (matching criteria), and a **Pipeline** of candidates being evaluated for it.
_Avoid_: Job, Role, Opening, Position, Search.

**Vacancy Status**:
A per-Organization configurable label describing where a **Vacancy** stands (e.g. "Active", "On Hold", "Filled", "Cancelled"). A status flagged `isFinal` is *terminal*: while a Vacancy sits in one it carries a **Close Date**, and leaving a final status clears it. The coupling is one-way on *existence* (final status ⟺ has a Close Date) — but the *value* of that date is recruiter-controlled, not the moment the status was clicked (see **Close Date**). The system does **not** currently distinguish successful (e.g. filled) from unsuccessful (e.g. cancelled) closures — all terminal statuses are a single bucket. This is intentional given current needs; revisit when fee-tracking or fill-rate reporting lands.

**Close Date** (code: `vacancies.closedAt`):
The date a **Vacancy** is recorded as having reached a terminal **Vacancy Status** — the end point of the Vacancy, and the basis for time-to-close reporting (e.g. `daysOpen` on the **Company Report**). Exists *only* while the Vacancy is in an `isFinal` status (entering sets it, leaving clears it), but its value is **chosen by the recruiter**, not the system clock: it defaults to today and is freely **backdatable** to reflect when the Vacancy *actually* closed rather than when someone got around to flipping the status — recruiters routinely update the system late, and an auto-stamped "now" silently inflated the metric. Day-granular. Deliberately **not range-validated** — values before the Vacancy existed are accepted on input and only guarded where rendered to a client. Set/changed/cleared through a dedicated close/reopen action that is **audited on its own axis**, separate from generic Vacancy edits, because it rewrites a client-facing metric.
_Avoid_: Closing Date, Deadline / Due Date (those imply a *future target*; a Close Date records a *past event*), Expiry, Closed-on.

**Vacancy Owner** (`vacancies.assignedTo`):
The single User currently responsible for running the **Vacancy** — the lead recruiter for that search. Reassignable, though changes are uncommon. Distinct from `createdBy`, which is an immutable audit field with no domain meaning. There is no notion of co-owners or collaborators today.
_Avoid_: Assignee, Lead Recruiter (ambiguous in mixed-role teams).

**Search Brief** (code: `VacancyFilters`; UI Spanish: "Perfil buscado"):
Structured criteria describing the ideal candidate profile for a **Vacancy** — seniority, area, industry, country/province, languages, age range, gender, minimum stars. Used (a) as a human-readable summary rendered on the vacancy and the **Vacancy Report**, and (b) as the default preset for the candidate-search UI when sourcing candidates for that vacancy. **Suggestive, not binding**: nothing in the system rejects, hides, or warns about candidates outside the brief. A vacancy with `minStars=3` may legitimately have a 2-star candidate in its **Pipeline**.
_Avoid_: Requirements, Criteria (when implying enforcement), Screening rules, Filters.

**Candidacy** (code: `CandidateVacancy`):
A specific **Candidate**'s involvement in a specific **Vacancy**. Carries the current **Pipeline Stage**, free-text notes, and (only while in a rejection stage) a **Rejection Reason** plus an optional **Rejection Note**. A given Candidate has at most one Candidacy per Vacancy at a time — enforced in the service layer, not at the DB. Candidacies don't move between Vacancies; the same Candidate appearing in another search is a separate Candidacy.
_Avoid_: Application (candidates don't apply, they're sourced), Submission (in this domain "submission" = the recruiter→client shortlist deliverable), CandidateVacancy (implementation alias only).

**Pipeline**:
The ordered sequence of **Pipeline Stages** that a **Candidacy** moves through, configured per **Organization**. Each Vacancy uses its Organization's pipeline; there is no per-Vacancy pipeline customization.

**Pipeline Stage** (code: `CandidateVacancyStatus`; UI Spanish: "Estados de Candidato"):
A single configurable stage in an Organization's **Pipeline**. Stages have a sort order. Exactly one is marked `isInitial` (the entry point — enforced as singleton at the service layer); any number can be marked `isRejection` (rejection outcome). The stage with the **highest `sort`** is the de facto "placed/hired" outcome — there is no explicit `isPlacement` flag yet, so when configuring stages the highest-sort one must be the success outcome.
_Avoid_: Status (overloaded — Vacancy and Company also have statuses; reserve "Pipeline Stage" for the Candidacy axis), Step, Phase.

**Rejection Reason** (code: `RejectionReason`; UI Spanish: "Motivo de rechazo"):
A per-Organization configurable picklist label categorising *why* a **Candidacy** ended unsuccessfully — e.g. "Excede salario", "No interesado", "No tiene el perfil buscado", "Otro". A flat, reorderable taxonomy in the same family as **Candidate Source** / **Area** / **Industry** (a plain label with no behavior of its own), **not** a **Pipeline Stage**: a Pipeline Stage answers *where* a Candidacy is (a position dragged through), a Rejection Reason answers *why* it ended (orthogonal). A Candidacy carries **at most one** Rejection Reason, and exactly while it sits in a rejection (`isRejection`) **Pipeline Stage** — entering such a stage *requires* one; leaving to a non-rejection stage clears it (and the **Rejection Note**) to null. Exists to power per-**Vacancy** / per-**Company** rejection breakdowns (e.g. "5 candidates not interested, 3 exceeded salary"). A seeded "Otro" catch-all guarantees the required pick is reasonable; the list can never be emptied (deleting the last remaining reason is blocked) so the required pick is always satisfiable — "Otro" itself carries no special privilege and is renameable/deletable like any other while others remain.
_Avoid_: Rejection Stage / Rejection Status (that's the `isRejection` **Pipeline Stage** — the *where*, not the *why*), Rejection Category (code alias only), Reason (bare — collides with **Blacklist** `reason`).

**Rejection Note** (code: `CandidateVacancy.rejectionNote`; UI Spanish: "Comentario"/"Detalle"):
Optional free-text elaboration on a **Candidacy**'s **Rejection Reason** (e.g. "wanted 20% above band, declined our counter"). Was historically the *only* rejection field (then named `rejectionReason`); demoted to a note when the structured **Rejection Reason** was introduced. Optional even when the Rejection Reason is required, and governed by the same lifecycle: present only while in a rejection **Pipeline Stage**, cleared on leaving. Internal-only, never surfaced to the **Company**.
_Avoid_: Rejection Reason (that's now the structured category), Comment (the **Comment** entity is a Candidate-level note, a different concept).

**Candidate**:
A person known to an **Organization** as a potential placement, sourced and curated by recruiters. Belongs to exactly one Organization (`unique(name, organizationId)`). Today, Candidates are not self-registered and have no platform login — they're recruiter-curated records. Self-registration is technically possible to add later but is unusual for executive search.
A Candidate exists independently of any **Vacancy**: zero, one, or many **Candidacies** can reference the same Candidate. Has structured taxonomy (**Areas**, **Industries**, **Seniorities**), locality (countries / provinces / languages), curation fields (`stars`, `shortDescription`, **Comments**, **Blacklist**), and attached **Candidate Files** (CVs and similar).
_Avoid_: Applicant, User, Talent, Profile.

**Stars** (`candidates.stars`):
A 0–5 numeric rating reflecting recruiter judgement of a **Candidate**. No automated computation; not enforced by the DB; fractional values are allowed. Referenced by the **Search Brief**'s `minStars` as a non-binding preference.
_Avoid_: Score, Rating (when ambiguous).

**Blacklist**:
A flag on a **Candidate** indicating they should be hidden from default candidate searches. Carries a `reason` and the attributing User. Default candidate listings exclude blacklisted candidates; passing `blacklisted=true` reveals them. **Not** enforced at Candidacy creation — a blacklisted candidate can still technically be added to a **Vacancy** if surfaced explicitly. The hide-by-default-but-not-veto behavior is intentional.

**Candidate Source**:
A per-Organization named taxonomy describing where a **Candidate** was discovered (e.g. "LinkedIn", "Referral", "Database"). Plain label; no behavior attached.
_Avoid_: Origin, Channel.

**Candidate File**:
A named, URL-addressable file attached to a **Candidate** (CV, portfolio, etc.). Schema is many-to-many but in practice every Candidate File is associated with exactly one Candidate — the m2m is over-modeled and may be simplified later.

**Comment**:
A free-text internal note authored by a User on a **Candidate**. Internal-only — never surfaced to the **Company** or any external party. Today, Comments live only on Candidates (not on Vacancies or Candidacies).
_Avoid_: Note (vague), Annotation.

**Task**:
A unit of assignable recruiter work-to-be-done, carrying an *optional* due date and a *binary* done state (open or done — no configurable task-status workflow; dismissing a Task means deleting it), optionally attached to exactly one of a **Candidate**, **Vacancy**, **Candidacy**, or **Company** (or standalone — attached to nothing). A Task with no due date is valid (a backlog item) and never produces a **Notification**. A Task past its due date and not done is **overdue** — a derived state, never stored. Modelled on **Vacancy**, not **Comment**: like a Vacancy it has a `createdBy` (immutable audit, no domain meaning) and a single reassignable owner (**Task Owner**). It is *not* a **Comment** (a free-text note *about* a Candidate, no deadline, no completion) and *not* an **Audit Event** (an immutable record of something that already happened). Internal-only; never surfaced to the **Company**. An End-User-only concept — **Internal Users** have no Organization and therefore no Tasks.
_Avoid_: To-do, Reminder (that names the **Notification**, not the work), Action Item, Activity, Ticket.

**Task Owner** (`tasks.assignedTo`):
The single **User** responsible for completing a **Task** — the same single-owner, reassignable, no-co-owners model as **Vacancy Owner**. Distinct from `createdBy` (immutable audit field, no domain meaning): a User may create a Task assigned to a colleague. The "my tasks" view is the filter `assignedTo = me`, **not** a privacy boundary — Tasks are visible org-wide to any User with `TASK_READ`, and any User with `TASK_MANAGE` may edit, reassign, complete, or delete *any* Task in the Organization (no assignee-only mutation lock).
_Avoid_: Assignee (ambiguous in mixed-role teams — same reason as Vacancy Owner).

**Notification**:
A per-recipient, *mutable* in-app signal that a specific **User** has something to act on. Distinct from an **Audit Event** on every axis: an Audit Event is an *immutable*, actor-centric record of *what already happened* (accountability, `AUDIT_LOG_READ`); a Notification is a *dismissible* prompt toward *future* action, owned by its recipient and carrying a read/unread state. Generated when a **Task** the User owns becomes **due** or **overdue**, or when *another* User assigns a Task to them — a User is never notified of their own actions (self-assignment and self-owned new Tasks produce nothing). In v1 a Notification is delivered **in-app only**; email is a planned later *delivery channel for the same Notification*, not a separate concept. Also distinct from the **Task** itself — reading or dismissing a Notification never completes its Task — even though the v1 UI co-locates both on one list surface. Org-scoped like all domain data.
_Avoid_: Alert, Reminder (fine in UI copy, but the entity is a Notification), Message, Audit Event (different axis — see above).

**Area**:
A per-Organization functional discipline a **Candidate** works in or a **Vacancy** is hiring for — e.g. "Finance", "Engineering", "Sales", "Operations", "HR". Not geographic (geography is modeled separately as `countries[]` / `provinces[]`). A Candidate is typically tagged with several Areas.
_Avoid_: Region, Department, Function (ambiguous).

**Industry**:
A per-Organization business-sector label — e.g. "Banking", "Healthcare", "Manufacturing", "Tech". On a **Candidate** it reflects where they've worked; on a **Vacancy** / **Search Brief** it reflects the **Company**'s sector and/or desired-experience sectors. A Candidate is typically tagged with several Industries.
_Avoid_: Sector (when ambiguous), Vertical.

**Seniority**:
A per-Organization career-level label — e.g. "Junior", "Manager", "Director", "VP", "C-Level". A Candidate may carry several (e.g. spanning levels they've held).
_Avoid_: Level, Grade, Rank.

**User**:
An identified human with credentials. Has a **User Type** that determines which surface they log into; an `email` unique within their **Organization**; an optional **Role**; and a `lastLogin`. Belongs to at most one Organization (nullable for **Internal Users**).

**End User** (`UserType = END_USER`):
A User belonging to an **Organization** — a recruiter or staff member at the executive-search agency. Logs in only through the **Web app**. All day-to-day agency work happens through End Users. Auth invariant: an End User always has `organizationId != null`.

**Internal User** (`UserType = INTERNAL_USER`):
A HiringPeak operator (the SaaS company's own staff) who manages tenants and the global permission catalog. Logs in only through the **Backoffice app**. Auth invariant: an Internal User always has `organizationId == null`. Internal Users **bypass permission checks** in `PermissionsGuard` — they have blanket access on the Backoffice surface and carry no Role.

**Role**:
A per-Organization named bundle of **Permissions**. `isSystem` Roles are seeded and not user-editable. End Users have at most one Role; Role assignment is the unit of access control inside an Organization.

**Permission** (codes in `PermissionCode` enum):
A global, atomic capability (e.g. `CANDIDATE_MANAGE`, `VACANCY_READ`, `AUDIT_LOG_READ`). The same code catalog applies to every Organization; only how Roles bundle them differs. Enforced via the `@Permissions(...)` decorator + `PermissionsGuard`.

**Web app** (`apps/web`):
The Organization-facing application — what recruiters use. Auth requires `END_USER` with a non-null Organization.

**Backoffice app** (`apps/backoffice`):
The HiringPeak-operator application — what the SaaS company's own staff use to administer tenants and the permission catalog. Auth requires `INTERNAL_USER` with NULL Organization.

**Landing app** (`apps/landing`):
Marketing / public website. Not part of the product surface; no domain entities live in it.

**Audit Event** (DB: `audit_events`; module: `audit-log`; frontend type: `AuditLogItem`):
A single business-level action recorded in an append-only, immutable, tenant-scoped log. Each event captures an `eventType` string (e.g. `blacklist_candidate`, `create_user`), the actor User, the target entity type + id, optional `metadata` jsonb, and a timestamp. Recorded via the `@AuditAction(...)` decorator + interceptor. Visible to End Users carrying the `AUDIT_LOG_READ` permission.
_Avoid_: Audit Log Entry (the *log* is the collection; an *event* is the row), Activity Event.

**Vacancy Report**:
A per-**Vacancy** PDF, server-rendered on demand via `GET /vacancies/:id/report/pdf`. **The agency's deliverable to the Company** — the written summary of the search and its shortlist that the recruiter sends to the client. When making changes here, treat it as a client-facing artifact: copy, layout, and what's included matter.
_Avoid_: Shortlist (more specific), Submission.

**Company Report**:
A per-**Company** PDF aggregating across that Company's Vacancies, same delivery model as **Vacancy Report**. Also a client-facing deliverable; same change-with-care rule applies.

**Onboarding** (module: `onboard`):
The Internal-User-driven flow that provisions a new tenant. In one transaction: creates an **Organization**, seeds its default **Roles**, and creates the first **End User** (assigned the administrator Role). Run from the **Backoffice app**, protected by `InternalUserGuard`. There is **no self-service tenant signup** today — every new Organization is created by hand by a HiringPeak operator.
_Avoid_: Signup, Registration (imply self-service), Provisioning (too generic).

## Relationships

- Every persisted entity (except the platform-wide user/role/permission catalog and feature flags) belongs to exactly one **Organization**.
- A **Task** has one **Task Owner** and is attached to *at most one* of a **Candidate**, **Vacancy**, **Candidacy**, or **Company** (or none — standalone).
- A **Notification** belongs to exactly one recipient **User**; it is generated by a **Task** becoming due/overdue or being assigned. A Notification is never an **Audit Event** and vice versa.
- A **Task**'s lifecycle is *independent* of its attached entity's domain state: closing/filling a **Vacancy** or rejecting a **Candidacy** never auto-completes, hides, or removes its Tasks (consistent with the existing "terminal status doesn't cascade" precedent). Only a hard-delete of the attached row cascades the Task away via FK.

## Example dialogue

> **Dev:** "When a recruiter adds a **Candidate** to a **Vacancy**, do we check that the Candidate's seniority matches the **Search Brief** before creating the **Candidacy**?"
> **Domain expert:** "No — the Search Brief is suggestive, not binding. A 2-star candidate can sit in a Vacancy whose Brief says `minStars=3` if the recruiter has a reason. The Brief is the recruiter's pitch deck for the Company, not a screening rule."
>
> **Dev:** "If we cancel a search halfway through — client pulls out — what happens? The **Vacancy** moves to a final **Vacancy Status**, but does that mark all the **Candidacies** as rejected too?"
> **Domain expert:** "No, those are independent. Marking the Vacancy as `Cancelled` (or whatever the Organization named that final status) just sets `closedAt`. The Candidacies stay where they are. Today the system doesn't distinguish 'Vacancy was cancelled' from 'Vacancy was filled' — both are just terminal."
>
> **Dev:** "I want to add a 'placed candidates' metric for the new dashboard. I'll count Candidacies whose **Pipeline Stage** is the highest-`sort` one in the Organization's pipeline."
> **Domain expert:** "That's how the system infers it today, but treat it as fragile. There's no `isPlacement` flag — it's a convention. If you build a metric on top, flag it for the cleanup that adds a real flag, otherwise it'll silently break for any Organization that adds a higher-sort stage later. And don't reuse `isInCompanyViaPratt` for this — that's a single-customer leak we're removing."
>
> **Dev:** "When an **Internal User** logs into the **Backoffice app**, do they see all the Organizations' data?"
> **Domain expert:** "They have the access — `PermissionsGuard` bypasses checks for `INTERNAL_USER` — but the Backoffice surface today is scoped to *managing tenants*, not *operating in them*. There's no impersonation flow: an Internal User has `organizationId == null` always, and the End-User APIs require an organization in CLS. So they can create Organizations and edit the global permission catalog, not work inside one."
>
> **Dev:** "Recruiter A is on leave with an overdue **Task** attached to a **Candidacy**. Recruiter B needs it done before the client call — can B complete A's Task, and does the system log that as an **Audit Event** or a **Notification**?"
> **Domain expert:** "B can do it — any User with `TASK_MANAGE` can complete, reassign, or delete *any* Task in the Organization; 'my tasks' is just the `assignedTo = me` filter, not a privacy wall. B completing it is a business action B performed, so it's an Audit Event (accountability). The overdue prompt that nagged A every morning was a Notification — recipient-owned, mutable, and deduped per `(task, kind, recipient)` so A's 12 carried-over overdue Tasks stay 12 prompts for A, not 84. Different axes; don't conflate them."
>
> **Dev:** "When B reassigns that Task back to A, A gets an assignment Notification. If A then reschedules its due date a week out, does the old overdue Notification resurface?"
> **Domain expert:** "Reassignment to A is a real new event, so yes, one assignment Notification. The overdue one is deduped per `(task, kind, recipient)` — but rescheduling the due date is exactly the case where it *should* regenerate for the current owner, because the deadline genuinely changed. A Task with no due date never produces due/overdue Notifications at all."

## Flagged ambiguities

- **`VacancyFilters` (code) is misleading** — the name implies enforcement, but the concept is a non-binding **Search Brief**. When discussing the domain, use "Search Brief"; treat `VacancyFilters` as an implementation alias only.
- **`isInCompanyViaPratt` is a Pratt-specific leak.** HiringPeak began as a custom project for one client (Pratt) and was generalized into a multi-tenant SaaS. The `candidates.isInCompanyViaPratt` column is set as a side-effect of moving a Candidacy into the highest-sort Pipeline Stage, and the column name encodes that single client. To be removed; do not use it as a generic "placed" flag and do not extend the pattern to new clients.
- **"Placed" outcome is implicit, not flagged.** Pipeline Stages have `isInitial` and `isRejection` flags but no explicit `isPlacement`. The highest-sort stage is the de facto success outcome. Acceptable while needs are simple; any future fee-tracking, fill-rate or success-metric work should add an explicit flag and migrate.
- **`CandidateVacancyState` enum (`APLICADO` / `RECHAZADO`)** in `packages/shared/src/enums.ts` is dead — no source references. Leftover from before the configurable Pipeline; safe to remove.
- **`unique(name, organizationId)` on candidates** is intentional today but acknowledged as fragile (common names like "John Smith" force recruiters to disambiguate in the name field). Likely to relax in the future; don't build features that hard-depend on candidate name being unique within an Organization.
- **"Notification" vs "Audit Event" — resolved: different axes.** Audit Event = immutable accountability record of a past actor action; Notification = mutable, recipient-owned prompt for future action with read/unread state. They share no storage and no code path. A deadline passing is a Notification, never an Audit Event. Email is a future *delivery channel* of a Notification, not a distinct concept.
- **Rejection breakdowns are a live snapshot, not history.** Because a **Rejection Reason** is cleared when a **Candidacy** leaves a rejection **Pipeline Stage**, the per-**Vacancy** / per-**Company** rejection counts in the PDFs reflect *currently-rejected* candidacies only. Un-rejecting a candidate removes them from the count; there is no "was once rejected for X" trail. A true history would need an **Audit Event**-style log — deliberately out of scope.
- **Client-visibility of Rejection Reasons is uncurated for now.** The **Rejection Reason** breakdown is rendered verbatim in the client-facing **Vacancy Report** / **Company Report**, including internally-flavoured reasons like "Referencias negativas" or the circular "Descartado por el cliente". Accepted while the reason list is small and hand-managed. If it becomes awkward, the planned fix is a per-reason `clientVisible` flag (same pattern as `isRejection` on **Pipeline Stage**) filtering the PDF while recruiters keep the full internal breakdown — not hardcoded exclusions.
- **Rejection Stage and Rejection Reason can overlap by name — deliberate.** The seeded `isRejection` **Pipeline Stage** "No es el perfil" and the seeded **Rejection Reason** "No tiene el perfil buscado" are near-synonyms on purpose: both are vocabulary the Organization's recruiters actually use, on two different axes (*where* vs *why*). Not an inconsistency to dedupe.
- **`Task` widens attachment beyond `Comment`'s scope — deliberate.** `Comment` lives only on Candidates; `Task` attaches across Candidate/Vacancy/Candidacy/Company or stands alone. This is intentional, not an inconsistency to "fix" by forcing Tasks onto Candidates only.
