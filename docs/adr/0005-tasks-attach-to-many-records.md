---
status: accepted
---

# A Task attaches to any number of records, and its attachments decide who can see it

Tasks were attached to *at most one* record (one nullable FK column per type: Candidate, Vacancy, Company). The commercial side made one Task serve both recruiting work and commercial follow-ups, and a follow-up is naturally about several things at once — an Opportunity *and* the Contact you have to call. We let a **Task** attach to any number of Candidates, Vacancies, Candidacies, Companies, Contacts and Opportunities, in any combination, and made the attachments carry visibility: a Task with any Opportunity or Contact attached is *commercial* and only reaches Users with commercial-side access.

## Considered Options

- **Many attachments of any type (chosen)** — matches how follow-ups are actually described, and lets one Task be found from every record it concerns.
- **Keep a single attachment, derive related records from the parent** (an Opportunity's Task implicitly concerns its Company and Contacts) — simpler queries and permission checks, but a Task could only be found from one place, and "call Juan about the CFO search" had to pick one. Rejected by product call.
- **A separate commercial follow-up concept beside Task** — rejected: it would duplicate ownership, due dates and Notifications, which Tasks already have.

## Consequences

- **Visibility is computed from attachments, not from Task permissions alone.** A User with `TASK_READ_ALL` but no commercial access still never sees a commercial Task, and a commercial Task can only be owned by a User with commercial access. Search work involving a client-side person is attached to the Vacancy, not the Contact, so it stays visible to recruiters.
- **A Task stays commercial after the record that made it so is deleted.** Deleting an attached record removes only that attachment — the Task survives (standalone if nothing is left) and never silently becomes visible to recruiters.
- **Every Task list and permission check joins through the attachments.** The per-type FK columns no longer describe a Task on their own.
