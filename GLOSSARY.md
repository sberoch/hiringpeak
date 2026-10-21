# HiringPeak

A multi-tenant ATS (applicant tracking system) for executive-search recruiting agencies. Each tenant ("Organization") manages its client companies, the vacancies those clients are hiring for, and a curated pool of sourced candidates moving through a per-organization configurable pipeline.

Executive search shapes the design: low-volume, high-touch, candidates are *sourced* by recruiters rather than self-applying, qualitative judgement matters (e.g. star ratings), and the deliverable is often a written shortlist (per-vacancy / per-company PDF reports).

## Language

**Organization**:
An executive-search firm operating on the platform; the tenant boundary and the unit of paid subscription (one Organization == one paying customer). All domain data — candidates, vacancies, client companies, pipeline stages, users, audit records — belongs to exactly one Organization and is never shared across them.
_Avoid_: Tenant, Account, Workspace, Agency, Firm.

**Company**:
An external firm the **Organization** has a commercial relationship with — whether a prospect it is pitching or a client that has engaged it to fill one or more **Vacancies**. One continuous record across the whole relationship: a prospect does not "convert" into a different entity when it signs. A Company is *not* a tenant: it has no login and never accesses the platform directly; the Organization's users interact with it on its behalf.
_Avoid_: Client, Account, Customer, Employer, Lead.

**Contact** (UI Spanish: "Contacto"):
A person the **Organization** has, or wants, a commercial relationship with — the CEO who signs, the CHRO who briefs the search, or someone a partner met at an event who might one day bring business. The relationship is with the *person*: a Contact may work at a **Company** the Organization tracks, or have no Company at all. Being a Contact implies nothing about an **Opportunity** — most never lead to one. Not a platform user, and deliberately *not* a **Candidate**: the same human may be both, but the two records are kept separate and are not linked. Follow-ups with a Contact ("reach out in 10 days") are **Tasks** attached to them — any open Task attached to the Contact counts, whoever owns it; a Contact has no stage or status of its own.
A Contact's Company is their *current* employer and changes when they move: the same Contact follows the person from Acme to Globex, keeping all their history. Nothing is rewritten by the move, because each **Interaction** records the Company it was with at the time; past **Opportunities** and **Vacancies** at the old Company keep pointing to the Contact. The same person entered twice is tolerated — creation warns about a likely duplicate but never blocks it. A **Vacancy** may name one Contact as its **Vacancy Contact**.
_Avoid_: Client Contact (the former single embedded contact, superseded), Lead, Hiring manager, Sponsor.

**Contact Source** (UI Spanish: "Origen"):
A per-Organization picklist label for how the Organization came to know a **Contact** — e.g. "Evento", "Referido", "LinkedIn". Same family as **Candidate Source**: a plain label with no behavior. The specifics ("AmCham 2026") belong in the first **Interaction**, not in the label.
_Avoid_: Candidate Source (that's the **Candidate** axis), Origin, Channel.

**Contact Owner**:
The single **User** whose relationship a **Contact** is — whose network the person belongs to. Optional, reassignable, defaults to the User who created the Contact. Follow-up **Tasks** on a Contact are owned by whoever creates them — adding a follow-up means committing to it yourself — except the follow-up scheduled while capturing a new Contact ("reach out in X days"), which goes to the Contact Owner. Same single-owner model as **Account Owner**, and likewise must have access to the commercial side.
_Avoid_: Account Owner (that's the **Company** axis), Assignee.

**Vacancy Contact**:
The **Contact** who is the client-side counterpart for one **Vacancy** — the person that search is run with. Optional, at most one per Vacancy, and it varies by search rather than being fixed per **Company** (the CEO for the CFO search, HR for an analyst search). This is the person the client-facing **Company Report** shows for each Vacancy — by name and role only, never their email or phone. There is no "primary Contact" on a Company.
_Avoid_: Primary contact, Hiring manager.

**Account Owner**:
The single **User** responsible for the Organization's overall relationship with a **Company** — keeping it warm between and beyond individual **Opportunities**. Same single-owner, reassignable, no-co-owners model as **Vacancy Owner**. Distinct from **Opportunity Owner**: the Account Owner owns the relationship, an Opportunity Owner owns one possible deal within it.
Optional — a Company may have none. Only a **User** with access to the commercial side can be an Account Owner.
_Avoid_: Relationship manager, Assignee.

**Opportunity** (UI Spanish: "Oportunidad"):
One possible piece of work for one **Company**, tracked from the first real commercial conversation until it is won or lost. Belongs to exactly one Company. A won Opportunity can lead to zero or more **Vacancies**, each created one at a time and linked back to it; a Vacancy need not come from an Opportunity. *Only a won* Opportunity can produce or be linked to a Vacancy — if work has started, the deal is won. Moving an Opportunity back out of won is allowed and leaves its Vacancies untouched (state changes don't cascade).
_Avoid_: Deal, Lead (a not-yet-qualified contact, not a possible project), Project, Search (that's a **Vacancy**).

**Opportunity Stage** (UI Spanish: "Etapa"):
A per-Organization configurable, ordered stage an **Opportunity** moves through — the commercial counterpart of a **Pipeline Stage**. Exactly one stage is flagged as the *won* outcome and exactly one as the *lost* outcome; the outcome is never inferred from sort order, and the won and lost stages always sort after every open stage. Which stage carries an outcome flag can only change while neither the stage giving it up nor the one receiving it holds any Opportunity.
_Avoid_: Status, Pipeline Stage (that's the **Candidacy** axis).

**Lost Reason** (UI Spanish: "Motivo de pérdida"):
A per-Organization configurable picklist label categorising *why* an **Opportunity** was lost — e.g. "Precio", "Eligió otra consultora", "Se canceló la búsqueda". The commercial counterpart of **Rejection Reason**, with the same lifecycle: an Opportunity carries exactly one Lost Reason while in the lost stage — entering it requires one, leaving it clears it. Answers *why*, while the **Opportunity Stage** answers *where*.
_Avoid_: Rejection Reason (that's the **Candidacy** axis), Reason (bare).

**Opportunity Close Date** (UI Spanish: "Fecha de cierre"):
The date an **Opportunity** was won or lost — the basis for "won this year" and win-rate figures. The commercial counterpart of a **Vacancy**'s **Close Date**, with the same rules and for the same reason (people update the system late): it exists only while the Opportunity sits in the won or lost **Opportunity Stage**, defaults to today on entering it, is freely backdatable, and leaving won/lost clears it.
_Avoid_: Close Date (bare — that's the **Vacancy**'s), Won date, Deadline.

**No Next Step** (UI Spanish: "Sin próximo paso"):
A derived state of an open **Opportunity** (neither won nor lost) that has no open **Task** attached — nobody has committed to doing anything about it. Never stored. The system's answer to follow-ups depending on someone remembering. Applies to Opportunities only — never to **Contacts**, most of whom legitimately have nothing pending.
_Avoid_: Stale, Stalled (imply elapsed time; this is about a missing commitment, not inactivity).

**Commercial side** (permissions: `CRM_READ` / `CRM_MANAGE`):
The part of the platform about winning and keeping **Companies** — **Opportunities**, **Estimated Fees**, **Interactions**, setting **Account Owners**, and configuring **Opportunity Stages** and **Lost Reasons**. Part of the core product, gated only by those two permissions (one pair, Organization-wide, no own-vs-all split). Users without them — typically recruiters — still see **Companies**, a Company's **Contacts** (who they are and how to reach them), the **Account Owner** and **Company Status** read-only, since search work needs them — but not the Organization's wider network: Contacts without a Company, **Contact Source**, **Contact Owner**, and Contacts' follow-ups belong to the commercial side; editing Companies stays under `COMPANY_MANAGE`, while creating and editing Contacts is allowed with either `COMPANY_MANAGE` or `CRM_MANAGE`, since most Contacts are now the commercial network rather than client-side counterparts.
_Avoid_: Sales module.

**Opportunity Owner**:
The single **User** responsible for moving an **Opportunity** forward. Same single-owner, reassignable, no-co-owners model as **Vacancy Owner**. Defaults to the Company's **Account Owner**, else to the User creating the Opportunity. Must be a User with access to the commercial side.
_Avoid_: Assignee, Salesperson.

**Estimated Fee**:
The amount an **Opportunity** is expected to bill if won — a single hand-entered estimate, not derived from salary × fee % and not split into installments (that belongs to future invoicing). Like every other amount in the platform it carries no currency: there is no multicurrency. Optional until someone estimates it. The basis for "how much business is at stake": open Opportunities' Estimated Fees are simply totalled, with no probability weighting.
_Avoid_: Value, Amount (bare), Revenue (implies money already earned).

**Interaction** (UI Spanish: "Interacción"):
A record of something that happened between the **Organization** and one or more **Contacts** and/or a **Company** — a call, meeting, email or lunch — with a type, the date it happened, a summary, and the **User** who recorded it; involves at least one Contact or a Company, and is optionally tied to an **Opportunity**. The Company it records is the one it was with *at the time* (defaulting to the Contacts' current Company), so a Contact later changing employer never moves past Interactions between Companies. The unit of relationship history. Logged by hand, and part of the commercial side only — recruiters' day-to-day exchanges with a client during a search are not Interactions.
_Avoid_: Activity (ruled out alongside **Task**), Comment (a note on a **Candidate**), Note, Touchpoint, Audit Event (a system record of a User's action in the platform, not a real-world exchange with a client).

**Company Status** (`Prospect` | `Client`):
Where a **Company** stands commercially — *derived*, never set by hand. `Client` = the Company has ever had a won **Opportunity** or any **Vacancy**; `Prospect` = neither. Counting Vacancies keeps clients that predate Opportunities correct. There is no "lost" or "churned" status: a client the Organization has drifted away from is a view over the date of its latest **Interaction**, not a status.
_Avoid_: Active (the former manual value — "active" wrongly suggests current work is running).

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

**Candidate** (UI Spanish: "Postulante"):
A person known to an **Organization** as a potential placement, sourced and curated by recruiters. Belongs to exactly one Organization (`unique(name, organizationId)`). Today, Candidates are not self-registered and have no platform login — they're recruiter-curated records. Self-registration is technically possible to add later but is unusual for executive search.
A Candidate exists independently of any **Vacancy**: zero, one, or many **Candidacies** can reference the same Candidate. Has structured taxonomy (**Areas**, **Industries**, **Seniorities**), locality (countries / provinces / languages), curation fields (`stars`, `shortDescription`, **Comments**, **Blacklist**), and attached **Candidate Files** (CVs and similar).
_Avoid_: Applicant (in English), User, Talent, Profile. "Postulante" is the established Spanish UI word and does not imply self-application.

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
A unit of assignable work-to-be-done — recruiting work and commercial follow-ups alike — carrying an *optional* due date and a *binary* done state (open or done — no configurable task-status workflow; dismissing a Task means deleting it), attached to any number of **Candidates**, **Vacancies**, **Candidacies**, **Companies**, **Contacts** and **Opportunities**, in any combination (or none — standalone). A commercial follow-up is not a separate concept: it is a Task attached to commercial records. A Task with any **Opportunity** or any **Contact** attached is *commercial* — so a follow-up with someone from the Organization's network never reaches recruiters; search work that involves a client-side person is attached to the **Vacancy** instead. A Task stays commercial if the record that made it so is later deleted: only Users with access to the commercial side can see, create or own it — read access (`CRM_READ`) is enough — and within that, their Task permissions apply as usual. A Task with no due date is valid (a backlog item) and never produces a **Notification**. A Task past its due date and not done is **overdue** — a derived state, never stored. Modelled on **Vacancy**, not **Comment**: like a Vacancy it has a `createdBy` (immutable audit, no domain meaning) and a single reassignable owner (**Task Owner**). It is *not* a **Comment** (a free-text note *about* a Candidate, no deadline, no completion) and *not* an **Audit Event** (an immutable record of something that already happened). Internal-only; never surfaced to the **Company**. An End-User-only concept — **Internal Users** have no Organization and therefore no Tasks.
_Avoid_: To-do, Reminder (that names the **Notification**, not the work), Action Item, Activity, Ticket.

**Task Owner** (`tasks.assignedTo`):
The single **User** responsible for completing a **Task** — the same single-owner, reassignable, no-co-owners model as **Vacancy Owner**. Distinct from `createdBy` (immutable audit field, no domain meaning): a User may create a Task assigned to a colleague. Task access is two independent layers — **read** and **manage** — each scoped either to own Tasks (`assignedTo = me`) or org-wide: `TASK_READ` / `TASK_READ_ALL` for visibility; `TASK_MANAGE` / `TASK_MANAGE_ALL` for create, edit, reassign, complete, and delete. Without an `_ALL` permission, the scope is strictly own Tasks only — enforced in the API, not just the UI. On **create**, a User with `TASK_MANAGE` but not `TASK_MANAGE_ALL` may only assign the new Task to themselves; delegating work to a colleague on create requires `TASK_MANAGE_ALL`. The tasks UI defaults to the broadest read scope allowed: all Tasks when the User has `TASK_READ_ALL`, own Tasks otherwise. Users without `TASK_READ_ALL` see no scope toggle in the UI — their list is always their own backlog; secondary filters (overdue, no due date, notifications) apply on top.
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
A global, atomic capability (e.g. `CANDIDATE_MANAGE`, `VACANCY_READ`, `AUDIT_LOG_READ`). The same code catalog applies to every Organization; only how Roles bundle them differs. Enforced via the `@Permissions(...)` decorator + `PermissionsGuard`. **Task** permissions form two parallel pairs: read (`TASK_READ` = own Tasks, `TASK_READ_ALL` = every Task in the Organization) and manage (`TASK_MANAGE` = own Tasks, `TASK_MANAGE_ALL` = every Task). The `_ALL` codes are strictly additive — they widen scope beyond own Tasks; they do not replace the base codes. In the default Role seed, **Administrador** and **Manager** carry all four Task permissions; **Basic** carries only the base pair (`TASK_READ` + `TASK_MANAGE`) — own backlog only.

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
A per-**Vacancy** Report, server-rendered on demand in two **Report Formats** (PDF / Excel). Its **PDF** rendering is **the agency's deliverable to the Company** — the written summary of the search and its shortlist that the recruiter sends to the client. When making changes to the PDF rendering, treat it as a client-facing artifact: copy, layout, and what's included matter. The **Excel** rendering is an internal data dump (see **Report Format**) and is *not* governed by the client-facing rule.
_Avoid_: Shortlist (more specific), Submission.

**Company Report**:
A per-**Company** Report aggregating across that Company's Vacancies, same delivery model and two **Report Formats** as **Vacancy Report**. Its **PDF** rendering is a client-facing deliverable; the same change-with-care rule applies to the PDF. The **Excel** rendering is an internal data dump (see **Report Format**).

**Report Format** (`PDF` | `Excel`):
The two on-demand renderings every **Report** (**Vacancy Report**, **Company Report**, **Vacancy List Report**) is produced in, from the same underlying data, tuned to opposite objectives. **PDF** — curated, styled, layout-controlled; for the two client deliverables it *is* the artifact the recruiter sends to the **Company**, so it carries only client-appropriate fields. **Excel** — a dense, structured-table rendering that prioritises *completeness over styling*: it dumps **all** available data, **including internal-only fields the PDF omits** (**Rejection Note**, **Blacklist** reason, **Comments**). Because of that, the Excel rendering of even the two otherwise client-facing reports is an **internal** working artifact, not a client deliverable: a recruiter who wants to hand one to a **Company** is responsible for curating it first (e.g. deleting columns) — the system performs **no** redaction, and Excel column-hiding is presentation only, not removal (a knowingly-accepted tradeoff). Adding the Excel format is why "Vacancy Report" / "Company Report" no longer denote *a PDF* but a format-agnostic Report with two renderings.
_Avoid_: Export / Download (names the action, not the artifact — same rule as **Vacancy List Report**).

**Vacancy List Report**:
An **internal** listing Report of **Vacancies** across the Organization, rendered as PDF or Excel (see **Report Format**) on demand, scoped by whatever **Search**/filter criteria the recruiter has active on the vacancies list screen (status, **Company**, **Vacancy Owner**, **Search Brief** facets, etc.). One block per Vacancy summarising it (title, Company, **Vacancy Status**, **Vacancy Owner**, **Search Brief** facets — **Seniority** / **Area** / **Industry**, salary, candidate count, created date, **Close Date**, days-open) — *not* the per-Vacancy shortlist. Rendered portrait, one stacked multi-line block per Vacancy (not a single-line table row), reusing the existing **Vacancy Report** / **Company Report** PDF visual language (slim header, summary band, card surfaces). The candidate count is the number of **Candidacies** (**Pipeline** size), labelled in UI Spanish as "postulantes" (the Spanish UI word for **Candidate**), never "applicants" in English copy. "Created" is `createdAt` (system audit timestamp); days-open is derived (close-or-today minus created, clamped at 0). Unlike the **Vacancy Report** and **Company Report**, this is **not** a client-facing deliverable: it spans multiple Companies and may surface internal-only data, so it is exempt from the client-facing change-with-care rule and must never be conflated with the two client deliverables. Mirrors the *filtered set*, ignoring the screen's pagination (exports all matches, not the current page).
_Avoid_: Vacancy Report (that's the single-Vacancy client deliverable), Export / Download (name the artifact, not the action)._

**Onboarding** (module: `onboard`):
The Internal-User-driven flow that provisions a new tenant. In one transaction: creates an **Organization**, seeds its default **Roles**, and creates the first **End User** (assigned the administrator Role). Run from the **Backoffice app**, protected by `InternalUserGuard`. There is **no self-service tenant signup** today — every new Organization is created by hand by a HiringPeak operator.
_Avoid_: Signup, Registration (imply self-service), Provisioning (too generic).

**Column Layout**:
A **User**'s own choice of which columns a list screen shows and in what order, picked from that screen's **Column Catalogue**. Personal: changing it never affects another User. A preference, never a permission: columns the User may not see are skipped, not granted. Does not shape any **Report**.
_Avoid_: View, Saved View (reserved for a future saved filter set), Table settings.

**Column Catalogue**:
The fixed set of columns a list screen *can* show, each declaring whether it is shown by default. The identifier column is locked first and the actions column locked last; every other column can be hidden or reordered.

**Dashboard Layout**:
A **User**'s own choice of which **Widgets** their dashboard shows and in what order, kept separately for each **Widget Area**. Same personal, preference-not-permission rules as **Column Layout**.
_Avoid_: Dashboard config, Home settings.

**Widget**:
One self-contained block of the dashboard (e.g. a single stat, the team table, due-soon Tasks), offered from the catalogue of exactly one **Widget Area**. A Widget never moves to another Area.
_Avoid_: Card, Tile, Panel.

**Widget Area** (`Stat` | `Wide` | `Rail`):
One of the three regions of the dashboard, each with its own Widget catalogue: **Stat** (the row of single-number stats), **Wide** (the main column) and **Rail** (the side rail). Widgets are reordered only within their Area.

**Branding**:
An **Organization**'s logo and accent color. The logo replaces HiringPeak's in the **Web app** sidebar and in the PDF renderings of the **Vacancy Report** and **Company Report**; the accent color applies to those PDFs only. A branded PDF carries no HiringPeak mark. Without Branding, the PDFs show the Organization's name as a text wordmark in the default color. The login page and favicon always stay HiringPeak's.
_Avoid_: Theme (implies restyling the app), White-label (implies custom domains), Logo (only one part of it).

## Relationships

- Every persisted entity (except the platform-wide user/role/permission catalog and feature flags) belongs to exactly one **Organization**.
- A **Task** has one **Task Owner** and is attached to any number of **Candidates**, **Vacancies**, **Candidacies**, **Companies**, **Contacts** and **Opportunities** (or none — standalone).
- A **Notification** belongs to exactly one recipient **User**; it is generated by a **Task** becoming due/overdue or being assigned. A Notification is never an **Audit Event** and vice versa.
- A **Contact** works at *at most one* **Company** at a time (their current employer). A **Company** has many **Opportunities** and **Interactions**; an **Opportunity** always belongs to exactly one Company, so one that grows out of a Company-less Contact gives that Contact a Company at that moment; an **Opportunity** may lead to many **Vacancies**; a **Vacancy** may name one **Contact** as its **Vacancy Contact**.
- Deleting a commercial record never deletes history with it: deleting an **Opportunity** keeps its **Interactions** on the **Company** (unlinked), leaves its **Vacancies** standing (unlinked) and leaves its **Tasks** standing (unlinked, still commercial); deleting a **Contact** removes them from Interactions and Tasks and clears any **Vacancy Contact** pointing at them. Deleting the **Company** itself removes its Opportunities, Vacancies and the Interactions that involved no Contact — but never its people: its **Contacts** survive without a Company, and Interactions involving at least one Contact survive without the Company. A Company lists only its *current* Contacts; people who have moved on appear in its history through the Interactions and Opportunities they took part in.
- A **Task**'s lifecycle is *independent* of its attached entity's domain state: closing/filling a **Vacancy** or rejecting a **Candidacy** never auto-completes, hides, or removes its Tasks (consistent with the existing "terminal status doesn't cascade" precedent). Hard-deleting an attached record removes only that attachment; the Task survives (standalone if nothing is left).

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
> **Dev:** "Recruiter A is on leave with an overdue **Task** attached to a **Candidacy**. Recruiter B needs it done before the client call — can B complete A's Task?"
> **Domain expert:** "Only if B has `TASK_MANAGE_ALL`. With `TASK_MANAGE` alone B can touch only Tasks they own — A's Task is invisible in the list and blocked by the API. An **Administrador** with both `_ALL` permissions can see and complete it. B completing someone else's Task is an **Audit Event** (accountability). The overdue prompt that nagged A was a **Notification** — recipient-owned, mutable, deduped per `(task, kind, recipient)`. Different axes; don't conflate them."
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
- **Excel report renderings dump internal-only data; client-prep is manual and unredacted — accepted.** The **Excel** **Report Format** of the otherwise client-facing **Vacancy Report** / **Company Report** deliberately includes internal-only fields the PDF omits (**Rejection Note**, **Blacklist** reason, **Comments**). It is an internal working artifact; a recruiter sharing one with a **Company** must strip columns first, and Excel column-hiding is *not* redaction (the data is still in the file). Knowingly accepted by the domain owners — recruiters understand the file carries internal data. Not to be "fixed" by silently filtering the Excel to the PDF's client boundary; the whole point of the Excel is completeness.
- **Rejection Stage and Rejection Reason can overlap by name — deliberate.** The seeded `isRejection` **Pipeline Stage** "No es el perfil" and the seeded **Rejection Reason** "No tiene el perfil buscado" are near-synonyms on purpose: both are vocabulary the Organization's recruiters actually use, on two different axes (*where* vs *why*). Not an inconsistency to dedupe.
- **Vacancy List Report renders unbounded and synchronously — accepted risk.** The **Vacancy List Report** exports *every* Vacancy matching the active filters with no row cap, rendered in-process via `renderToBuffer`. With no filters that is the whole Organization, and a large set blocks the Node event loop during render. Deliberately un-capped for now (the domain is low-volume/high-touch, so sets are small in practice); revisit with a cap, async job, or streaming if it ever bites. Mentioned so the missing cap reads as a choice, not an oversight.
- **`Task` widens attachment beyond `Comment`'s scope — deliberate.** `Comment` lives only on Candidates; `Task` attaches across Candidate/Vacancy/Candidacy/Company/Contact/Opportunity, several at once, or stands alone. This is intentional, not an inconsistency to "fix" by forcing Tasks onto Candidates only.
- **Task `_ALL` backfill matches seed Role names only.** `TASK_READ_ALL` / `TASK_MANAGE_ALL` are auto-granted to existing Roles named exactly `Administrador` or `Manager`; `Basic` gains `TASK_MANAGE` if missing. A custom Role that *functionally* replaced `Manager` (e.g. `Reclutador`) needs a manual grant — not an oversight.
