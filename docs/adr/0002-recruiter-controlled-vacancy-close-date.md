---
status: accepted
---

# Vacancy Close Date is recruiter-controlled and backdatable, not the status-flip timestamp

A **Vacancy** closes when its **Vacancy Status** becomes `isFinal`; until now that flip auto-stamped `closedAt = now()`. Recruiters routinely update the system *late* — a Vacancy really closed three weeks ago, but the status only gets flipped today — so `now()` silently inflated `daysOpen` on the client-facing **Company Report**. We make the **Close Date** a value the recruiter sets (defaulting to today, freely backdatable) through a dedicated close/reopen action, while keeping the existing coupling that a Close Date exists *only* while the Vacancy is in a final status.

## Considered Options

- **Recruiter-controlled date, still coupled to final status (chosen)** — closing is still "reach a final status," but the date it records is user-pickable at flip-time and afterward. Preserves the one-way invariant `final status ⟺ has Close Date`; only the date's *value* is freed. Fixes the metric with zero new contradictory states.
- **Fully decouple `closedAt` from status** — make it a free-floating field settable regardless of status. Rejected: produces closed-but-"Active" and "Filled"-but-open states that every downstream consumer (both PDFs, `daysOpen`, the "Cerrada" badge) would have to second-guess, and reopens a question `CONTEXT.md` deliberately closed.
- **Derive the close date from the placed Candidacy's stage-change date** — infer it from when the candidate hit the success stage. Rejected: the system stores no stage-change history (rejection history is deliberately absent), and it can't date a *cancelled* Vacancy that never placed anyone.
- **Editable open date (`createdAt`) too** — the start of `daysOpen` is also a data-entry timestamp with the same staleness. Deliberately deferred: not the reported pain, and out of scope here. The metric is not fully "true" until this lands.

## Consequences

- **No range validation on input — guarded only at render.** Per product call, `closedAt` accepts *any* day, including before the Vacancy's `createdAt` (→ negative `daysOpen`) or in the future. Inputs are not rejected; instead the client-facing PDFs **clamp `daysOpen` at 0** so a fat-fingered date never prints "-12 days" to a client. The stored value is whatever was set. If validation is ever added, it belongs at the edge, not in the metric.
- **The service rule is centralized and load-bearing.** Both the generic `PATCH` (edit page, still stamps `now()` on a status flip) and the new close action must converge on one rule: *effective status final → `closedAt = providedDate ?? (now() if it was open, else keep current)`; effective status non-final → `closedAt = null`.* If this rule is duplicated rather than shared, the `final status ⟺ has Close Date` invariant will drift between the two paths.
- **Close/reopen is audited on its own axis.** Backdating rewrites a client-facing metric, so `close_vacancy` / `reopen_vacancy` are distinct **Audit Events** carrying old + new `closedAt` in metadata — not folded into the generic `update_vacancy` event, where "why did this number change?" would be unanswerable.
- **Date correction is the primary path, and often involves no status change.** The common case is "already flipped to Cubierta today, now fix the date" — the status doesn't change, only the date. The mechanism must allow a date edit while the Vacancy is already closed, which the old `statusId`-gated logic did not.
- **Successful vs unsuccessful closure is still one bucket.** This change does not add the `isPlacement` / fill-vs-cancel distinction; revisit alongside fee-tracking or fill-rate reporting, as already flagged in `CONTEXT.md`.
