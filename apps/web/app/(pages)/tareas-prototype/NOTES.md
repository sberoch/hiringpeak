# Prototype — Tareas + Notificaciones (interaction design)

**Question:** the domain model for Tasks + Notifications is settled (see
`CONTEXT.md`), but nothing about the screens is. What should the interaction
design be? Specifically:

- Create-task entry point: one global button vs per-entity "+ Tarea" vs both?
- Attachment picker UX (one of Candidate/Vacancy/Candidacy/Company, or none).
- Overdue visual treatment (derived state — no status field).
- Notification bell vs dedicated page vs both.
- "Mis tareas" / "Todas" as a tab toggle vs separate routes.

**Run it:** start the web app, open `/tareas-prototype`. Flip variants with
the floating bottom bar (or ← / → keys). Each variant is the *whole* feature
(list, create/edit form, tasks-in-context, dashboard widget, notifications)
expressed in one structure. All data is in-memory mock — nothing persists.

| Variant | Key idea | Create entry | Attachment picker | Notifications | Edit |
|---|---|---|---|---|---|
| **A — Bandeja unificada** | One prioritised inbox; tasks + notifs share the surface | Global button **+** per-entity (both feed one sheet) | Type chips → filterable list | A filter chip in the same list (no separate page) | Right-side Sheet |
| **B — Panel de vencimientos** | Deadline triage; dashboard stat-tiles ARE the filter | Global button only | Two plain selects (simplest) | Dedicated full view behind a bell | Inline row expand |
| **C — Split maestro-detalle** | Fast triage; list + instant inline editor | Global button (blank draft in right pane) | Search-as-you-type command list | Bell dropdown **and** pinned "Para vos" block | Inline right pane |

## Verdict — decided

- **Chosen direction: Variant A — "Bandeja unificada".** B and C can be deleted.
- **Filter chips:** brand electric for the active chip (`bg-electric text-white`),
  NOT black/`bg-ink`. (The black bottom switcher bar is the throwaway tool, not
  part of the design — leave it.)
- **Global "I have X tasks" signal: count badge on the "Tareas" sidebar item.**
  **Total open only — no overdue/red breakdown.** Just the count when you have
  tasks, nothing when zero. It's the standing-workload signal, visible on every
  screen because the sidebar is persistent. Demoed in-app via the
  `SidebarBadgeDemo` mock in variant A (live count + empty state).
  - The badge counts **`assignedTo = me` open tasks** (your standing workload).
  - **No notification bell in v1** (user-decided). Notifications surface
    *only* as a filter chip in the unified Tareas list — no bell, no
    separate notifications page. A Notification row and a Task row are
    distinct row types with distinct actions (mark read/dismiss vs.
    complete/edit/reassign); sharing the list surface does not merge the
    two axes (Notification ≠ Task, per `CONTEXT.md`). The bell is a
    possible post-v1 addition, not in scope.
  - Per-entity "N tareas" chips on Candidate/Vacancy/Company/Candidacy pages
    remain the **contextual** complement (see the "Vista de contexto" card).

### Still open / to settle at implementation

- Attachment picker: variant A ships the "type chips → filterable list" style.
  Confirm vs. reusing the exact candidate/vacancy pickers from commit `517da0a`.
- Notifications surface: SETTLED — filter chip in the same list, no bell,
  no separate page for v1 (user-decided). Bell is post-v1, out of scope.
- Mis / Todas: kept as chips in variant A.

> Next session: `/to-prd` or `/to-issues` to fold Variant A + the sidebar
> badge into the real implementation, then **delete this `tareas-prototype`
> folder** (including the `SidebarBadgeDemo` mock — wire the real badge into
> `apps/web/components/sidebar/sidebar-content.tsx` instead).
