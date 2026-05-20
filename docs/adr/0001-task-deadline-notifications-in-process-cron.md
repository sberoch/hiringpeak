---
status: accepted
---

# Task deadline Notifications run on an in-process hourly cron, swept across all Organizations

The Tasks + Notifications feature needs time-based delivery (a **Task** becoming due/overdue must generate a **Notification**), but the codebase has no scheduler, no queue, and no Redis — and is deployed as a *single* `api` container. We use **`@nestjs/schedule`** with an in-process `@Cron` running **hourly** to generate deadline Notifications, idempotent via the `(taskId, kind, recipientUserId)` Notification dedup rule. The `assigned` Notification is *not* swept — it fires synchronously at assignment time.

## Considered Options

- **In-process `@nestjs/schedule` cron (chosen)** — zero new infrastructure; safe without a distributed lock *only because there is exactly one `api` instance*.
- **Postgres-polled `setInterval`** — no dependency but hand-rolled and strictly worse than the official scheduler.
- **External system cron → authenticated internal endpoint** — moves scheduling out of the app; extra protected route + ops surface, no benefit at current scale.
- **BullMQ + Redis** — robust retries/scheduling, but a whole new container and failure mode for a once-an-hour idempotent sweep. Rejected as massively over-built; the dedup rule already provides the idempotency that would have justified it.

## Consequences

- **The sweep has no CLS, therefore no `organizationId`.** Every other service method in this codebase filters by the CLS `organizationId`, which only exists inside an HTTP request. The sweep is a **platform-level** job that must iterate **all** Organizations and generate Notifications per-org. It deliberately *inverts* the "always tenant-scoped" rule that holds everywhere else — the single most likely thing for a future contributor to get wrong.
- **Hourly, not daily, on purpose.** Due dates are day-granular, so hourly only bounds detection latency to ≤1h — but it removes the "a deploy/restart coincided with the daily tick and an entire day of deadline Notifications was silently skipped" failure. A missed tick becomes a ≤1h delay, not a lost day.
- **Idempotency is load-bearing.** Safety under crash/restart/double-fire comes entirely from the `(taskId, kind, recipientUserId)` dedup rule, not from the scheduler. If that dedup rule is ever weakened, this decision must be revisited. The `recipientUserId` component is deliberate: it keeps reassignment of an already-overdue Task from silently *not* notifying its new owner (the slot is per recipient, not per task), while still bounding noise to one prompt per owner per kind.
- **Revisit trigger.** The moment the `api` is scaled beyond one instance, the no-lock assumption breaks; move to a Postgres advisory lock or an external trigger before scaling out.
