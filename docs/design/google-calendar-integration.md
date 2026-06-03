# Google Calendar Integration — Technical Design

## Overview

Enable End Users to sync their HiringPeak Tasks to a Google Calendar of their choice via OAuth 2.0. When a Task with a due date is created, updated, completed, or deleted, the corresponding calendar event is created, updated, or removed on the user's selected calendar.

---

## 1. Prerequisites (Google Cloud Console)

Before writing any code, the following must be configured in the Google Cloud project:

| Step | Detail |
|------|--------|
| **Enable Google Calendar API** | Google Cloud Console → APIs & Services → Library → Enable "Google Calendar API" |
| **Create OAuth 2.0 Client** | Credentials → Create Credentials → OAuth Client ID → Web Application |
| **Authorized Redirect URIs** | Add `https://<api-domain>/api/v1/integration/google-calendar/callback` |
| **OAuth Consent Screen** | Configure app name, logo, support email; add scope `https://www.googleapis.com/auth/calendar` |
| **App Verification** | Required before production use since `calendar` scope is a "restricted" scope — Google reviews the app |

### Required OAuth Scopes

| Scope | Purpose |
|-------|---------|
| `https://www.googleapis.com/auth/calendar` | Full read/write access to calendars and events (needed to create/update/delete events) |
| `openid` | Get the user's Google subject ID for token binding |
| `email` | Identify which Google account is connected |

### Environment Variables (new)

```env
GOOGLE_CALENDAR_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CALENDAR_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_CALENDAR_REDIRECT_URI=https://<api-domain>/api/v1/integration/google-calendar/callback
```

These are **separate** from the existing `GOOGLE_CLIENT_ID` used for Sign-In. A dedicated OAuth client keeps the Sign-In flow isolated from the Calendar integration flow — different redirect URIs, different scopes, different lifecycle. Critically, the `calendar` scope is a Google "restricted" scope requiring app verification review; coupling it with Sign-In would risk blocking the login flow during verification delays. Additionally, requesting calendar permissions during onboarding/sign-in is a poor UX — users should only be asked for calendar access when they explicitly opt into the integration from settings.

---

## 2. Architecture

```
┌──────────────┐     OAuth flow      ┌──────────────────┐
│   Web App    │ ──────────────────▶ │  Google OAuth    │
│  (Next.js)   │ ◀────────────────── │  2.0 Server      │
└──────┬───────┘                     └──────────────────┘
       │
       │ REST API
       ▼
┌──────────────┐    Calendar API     ┌──────────────────┐
│  NestJS API  │ ──────────────────▶ │  Google Calendar │
│              │ ◀────────────────── │  API             │
└──────┬───────┘                     └──────────────────┘
       │
       │ Drizzle ORM
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (tokens +   │
│   sync map)  │
└──────────────┘
```

### Flow Summary

1. **Connect**: User clicks "Connect Google Calendar" → redirected to Google consent screen → grants access → callback stores encrypted tokens + selected calendar ID.
2. **Sync on Task mutation**: Task created/updated/completed/deleted → `CalendarSyncService` checks if the task owner has an active integration → creates/updates/deletes the calendar event via Google Calendar API.
3. **Token refresh**: Before every API call, check token expiry; if expired, use refresh token to obtain a new access token transparently.

---

## 3. Database Schema

### 3.1 `google_calendar_integrations` table

Stores OAuth credentials and calendar selection per user, specific to Google Calendar. Each future provider (Outlook, etc.) gets its own table with provider-specific fields.

```typescript
// packages/shared/src/schemas/google-calendar-integration.schema.ts

export const googleCalendarIntegrations = pgTable("google_calendar_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  providerAccountId: text("provider_account_id"),  // Google subject ID
  accessToken: text("access_token").notNull(),     // encrypted at rest
  refreshToken: text("refresh_token"),             // encrypted at rest
  tokenExpiresAt: timestamp("token_expires_at"),   // when access_token expires
  scopes: text("scopes"),                          // space-separated granted scopes
  calendarId: text("calendar_id"),                 // selected calendar (e.g. "primary" or email)
  status: text("status").notNull().default("active"), // "active" | "revoked" | "error"
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("google_calendar_integration_user_idx")
    .on(table.userId),
  uniqueIndex("google_calendar_integration_provider_account_org_idx")
    .on(table.providerAccountId, table.organizationId),
]);
```

**Key design decisions:**

- **One Google Calendar integration per user** — enforced by the unique index on `userId`. No `provider` column needed; the table name is the provider.
- **Tokens encrypted at rest** — `accessToken` and `refreshToken` are AES-256-GCM encrypted before storage (see Section 5).
- **`calendarId`** — the user selects which calendar to sync to during the connect flow; stored here so we don't re-prompt.
- **`status`** — tracks health. Set to `"error"` if refresh fails repeatedly; set to `"revoked"` if the user disconnects.

### 3.1a Provider abstraction (app layer)

At the application layer, a strategy pattern + factory abstracts provider-specific implementations behind a unified interface:

```typescript
// apps/api/src/integration/calendar/calendar-service.interface.ts

interface ICalendarService {
  createTaskEvent(integrationId: number, task: TaskEventDto): Promise<string>;  // returns provider event ID
  updateTaskEvent(integrationId: number, providerEventId: string, task: TaskEventDto): Promise<void>;
  deleteTaskEvent(integrationId: number, providerEventId: string): Promise<void>;
  listCalendars(integrationId: number): Promise<CalendarOption[]>;
}

// apps/api/src/integration/calendar/calendar-service.factory.ts
// Resolves the correct ICalendarService implementation based on the provider
// e.g. GoogleCalendarService implements ICalendarService
```

This keeps the sync logic provider-agnostic while each integration table retains its own specific schema.

### 3.2 `calendar_event_mappings` table

Maps each Task to its corresponding Google Calendar event ID, enabling updates and deletions.

```typescript
// packages/shared/src/schemas/google-calendar-event-mapping.schema.ts

export const googleCalendarEventMappings = pgTable("google_calendar_event_mappings", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  integrationId: integer("integration_id").notNull()
    .references(() => googleCalendarIntegrations.id, { onDelete: "cascade" }),
  googleEventId: text("google_event_id").notNull(),  // ID returned by Calendar API
  calendarId: text("calendar_id").notNull(),          // calendar the event lives on
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("google_calendar_mapping_task_integration_idx")
    .on(table.taskId, table.integrationId),
]);
```

**Key design decisions:**

- **One mapping per (task, integration)** — a task syncs to exactly one event per user's calendar.
- **Cascade on task delete** — when a task is hard-deleted, the mapping is removed. The sync service must also delete the Google event before the mapping disappears (see Section 4.3).
- **`googleEventId`** — we use Google's generated event ID (not a custom one) for simplicity. Google generates IDs conforming to their format; we store the returned value.

---

## 4. Backend Module Design

### 4.1 Module structure

```
apps/api/src/integration/
├── integration.module.ts
├── integration.controller.ts        # OAuth flow endpoints
├── integration.service.ts           # Token storage, connect/disconnect
├── integration.dto.ts               # Request/response DTOs
├── google-calendar/
│   ├── google-calendar.module.ts
│   ├── google-calendar.service.ts   # Calendar API client wrapper
│   ├── google-calendar-sync.service.ts  # Task → Event sync logic
│   └── google-calendar-client.factory.ts # OAuth2Client factory
└── crypto/
    └── token-encryption.service.ts  # AES-256-GCM encrypt/decrypt
```

### 4.2 OAuth Flow Endpoints

```
GET  /integration/google-calendar/connect
     → Generates OAuth URL, redirects user to Google consent screen
     → Requires: authenticated End User

GET  /integration/google-calendar/callback
     → Handles Google's redirect with authorization code
     → Exchanges code for tokens, stores encrypted tokens
     → Fetches user's calendar list for selection
     → Redirects back to web app with success/error

GET  /integration/google-calendar/calendars
     → Lists user's Google Calendars (for the selection UI)
     → Requires: active integration

POST /integration/google-calendar/select-calendar
     → Sets the `calendarId` on the integration
     → If switching calendars: deletes all existing mappings (events on old calendar are left in place, same as disconnect), then triggers full backfill against the new calendar
     → If first selection: triggers initial full sync of existing tasks
     → Body: { calendarId: string }

DELETE /integration/google-calendar/disconnect
     → Revokes tokens at Google, deletes stored tokens and all mappings
     → Does NOT delete existing events from user's calendar
     → UI confirmation must warn: "Events already synced to your calendar will not be removed"
     → Requires: active integration

GET  /integration/google-calendar/status
     → Returns integration status (connected/disconnected, calendar name, last sync)
```

### 4.3 Task → Calendar Sync Logic

The sync runs **asynchronously** — task mutations return immediately, and calendar sync is processed in the background. This decouples task UX from Google Calendar API health.

**Mechanism:** An in-memory queue (processed by a `@nestjs/schedule` background worker) receives sync intents from `TaskService`. The worker drains the queue with retries and exponential backoff. No new infrastructure — same pattern as the existing deadline sweep (see ADR-0001).

```typescript
// Inside TaskService, after successful create/update/complete/delete:
this.calendarSyncQueue.enqueue({ taskId: task.id, action: 'reconcile' });
```

#### Sync rules (reconcile model)

The sync service derives the desired state from the task's current `dueDate`, `completed`, and `assignedTo` state, then reconciles against what actually exists (mapping present or not):

| Current task state | Mapping exists? | Action |
|---|---|---|
| Has `dueDate`, not completed, owner has integration | No | **Insert** — create event, store mapping |
| Has `dueDate`, not completed, owner has integration | Yes | **Patch** — update summary/date if changed |
| No `dueDate`, or completed (task done), or owner has no integration | Yes | **Delete** — remove event, remove mapping |
| No `dueDate`, or completed (task done), or owner has no integration | No | **No-op** |

**Reassignment** is handled as two independent checks: if the old owner had an integration, delete their event; if the new owner has one, create a new event. Each side is evaluated independently.

#### Event shape

```json
{
  "summary": "[HP] Review candidate shortlist",
  "description": "HiringPeak task — open in app: https://<web-domain>/tasks/42",
  "start": { "date": "2026-06-15" },
  "end": { "date": "2026-06-16" },
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "popup", "minutes": 1440 }
    ]
  }
}
```

- **All-day events** — Tasks have day-granular `dueDate`, so we use `start.date` / `end.date` (end is exclusive, so +1 day).
- **`[HP]` prefix** — visual indicator in the calendar that this event came from HiringPeak.
- **Minimal description** — task title in summary, link back to the task in HiringPeak in description. No attachment details (candidate names, vacancy names, company names) pushed to the calendar. Personal calendars may be shared; the calendar is a reminder surface, not a task detail view. Full context lives behind auth in HiringPeak.
- **Completion deletes the event** — when a task is completed, the calendar event is removed entirely. The task record in HiringPeak retains `completedAt` / `completedBy` for audit. The calendar is a deadline reminder surface, not a task history.
- **Reminders** — default 24-hour popup; configurable later.

### 4.4 Token Refresh Strategy

```typescript
async function getValidAccessToken(integration: Integration): Promise<string> {
  const now = new Date();
  const expiresAt = integration.tokenExpiresAt;

  // Refresh 5 minutes before actual expiry (buffer)
  if (expiresAt && expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    return decrypt(integration.accessToken);
  }

  // Token expired or about to expire — refresh
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET,
    GOOGLE_CALENDAR_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: decrypt(integration.refreshToken),
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update stored tokens
  await db.update(integrations)
    .set({
      accessToken: encrypt(credentials.access_token),
      tokenExpiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    })
    .where(eq(integrations.id, integration.id));

  return credentials.access_token;
}
```

**Error handling:**
- If refresh fails with `invalid_grant` → mark integration as `"error"`, notify user.
- If refresh fails with network error → retry once, then mark `"error"`.
- Never block the Task mutation if Calendar sync fails — log the error, mark the integration as `"error"`, and let the task operation succeed.

---

## 5. Token Encryption

Tokens are sensitive — they grant access to a user's Google Calendar. We encrypt at rest using AES-256-GCM.

```typescript
// apps/api/src/integration/crypto/token-encryption.service.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, 'hex'); // 32 bytes

function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decrypt(ciphertext: string): string {
  const [ivB64, tagB64, encB64] = ciphertext.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

**New env var:** `TOKEN_ENCRYPTION_KEY` — a 32-byte hex string, generated once and stored securely (same tier as `JWT_SECRET`).

---

## 6. Initial Sync (Backfill)

When a user first connects and selects a calendar, we backfill all their open tasks with due dates:

```typescript
async function initialSync(integrationId: number, userId: number) {
  const openTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.assignedTo, userId),
        eq(tasks.completed, false),
        isNotNull(tasks.dueDate),
      )
    );

  for (const task of openTasks) {
    await createCalendarEvent(integrationId, task);
  }
}
```

---

## 7. Frontend Integration Points

### Settings page

A new section in the user's settings/profile area:

- **"Google Calendar"** card showing connection status
- "Connect" button → opens OAuth flow (new tab or redirect)
- Calendar selector dropdown (fetched from `/integration/google-calendar/calendars`)
- "Disconnect" button with option to remove synced events

### Task sheet

No changes needed to the task creation form. The sync is automatic and transparent — if the assigned user has an active integration, the event appears on their calendar.

---

## 8. Permissions and Access Control

- **Connect/Disconnect**: Any authenticated End User can connect their own Google Calendar. No special permission needed — it's a personal integration.
- **Sync scope**: Only syncs tasks where the connected user is the `assignedTo` (Task Owner). A user cannot sync another user's tasks to their calendar.
- **No admin override**: An admin cannot force-sync tasks to a user's calendar; the user must connect voluntarily.

---

## 9. Failure Modes and Resilience

| Failure | Behavior |
|---------|----------|
| Google API rate limit (429) | Exponential backoff, max 3 retries in background queue |
| Token refresh fails | Mark integration `"error"`, show banner in UI, task mutation unaffected |
| Calendar event creation fails | Retry in background queue; mark integration `"error"` after 3 consecutive failures |
| User revokes access in Google | Next API call returns 401 → mark `"error"`, prompt reconnection |
| Task deleted before event created | Mapping doesn't exist → no-op |
| Duplicate event (race condition) | Unique index on `(taskId, integrationId)` prevents duplicate mappings |
| Same Google account connected by two users | Unique index on `(providerAccountId, organizationId)` blocks it. Backend returns a specific error (e.g. `GOOGLE_ACCOUNT_ALREADY_CONNECTED`). UI shows: "This Google account is already connected to your organization" |
| Background worker crash/restart | Queue is in-memory — pending syncs are lost. Acceptable for v1 (low volume); revisit with persistent queue if it bites |

---

## 10. Dependencies (npm)

The project already has `google-auth-library` installed. We additionally need:

```bash
pnpm add googleapis --filter api
```

The `googleapis` package provides the Calendar API client. It uses `google-auth-library` under the hood (already installed).

---

## 11. Migration

```sql
-- New migration file: apps/api/drizzle/0003_google_calendar_integration.sql

CREATE TABLE "google_calendar_integrations" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "provider_account_id" text,
  "access_token" text NOT NULL,
  "refresh_token" text,
  "token_expires_at" timestamp,
  "scopes" text,
  "calendar_id" text,
  "status" text NOT NULL DEFAULT 'active',
  "last_sync_at" timestamp,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "google_calendar_integration_user_idx"
  ON "google_calendar_integrations" ("user_id");

CREATE UNIQUE INDEX "google_calendar_integration_provider_account_org_idx"
  ON "google_calendar_integrations" ("provider_account_id", "organization_id");

CREATE TABLE "google_calendar_event_mappings" (
  "id" serial PRIMARY KEY,
  "task_id" integer NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "integration_id" integer NOT NULL REFERENCES "google_calendar_integrations"("id") ON DELETE CASCADE,
  "google_event_id" text NOT NULL,
  "calendar_id" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "google_calendar_mapping_task_integration_idx"
  ON "google_calendar_event_mappings" ("task_id", "integration_id");
```

---

## 12. Summary of New Environment Variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CALENDAR_CLIENT_ID` | OAuth client ID for Calendar integration |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Callback URL registered with Google |
| `TOKEN_ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM token encryption |

---

## 13. Open Questions

1. **Calendar event for tasks without due dates** — Currently excluded. Should we create events when a due date is later added?
2. **Multi-calendar** — v1 supports one calendar per user. Should we allow syncing different tasks to different calendars?

## 14. Resolved Design Decisions

- **v1 is push-only (HiringPeak → Google Calendar).** No listening for calendar-side events (completions, cancellations). The user completes tasks in HiringPeak; the calendar is a read-only mirror. Bidirectional sync is deferred — when demand arrives, the reverse channel must solve audit ambiguity (Google Calendar push notifications don't identify the actor) and edge cases (delete vs. complete).
- **Completed tasks delete their calendar event.** The event is a deadline reminder; once the task is done, the reminder is noise. Task history lives in HiringPeak (`completedAt`, `completedBy`), not on the calendar.
- **Calendar sync runs asynchronously via `@nestjs/schedule`.** Task mutations return immediately; sync is processed by a background worker with retries. No new infrastructure — same pattern as the existing deadline sweep (ADR-0001). In-memory queue means pending syncs are lost on crash/restart; acceptable for v1 low-volume usage. Revisit with a persistent queue (BullMQ, etc.) if data loss bites.
- **Calendar events carry minimal description.** Summary contains `[HP]` prefix + task title. Description contains only a link back to the task in HiringPeak. No attachment details (candidate names, vacancy names, company names) pushed to the calendar — personal calendars may be shared, and the calendar is a reminder surface, not a task detail view. Full context lives behind auth.
- **Disconnect leaves existing events in place.** When a user disconnects their Google Calendar, HiringPeak stops syncing but does not delete events already on the calendar. Tokens and mappings are removed server-side. The UI confirmation must warn the user that previously synced events will remain.
- **User deactivation/removal leaves existing events in place.** Same policy as disconnect — events on the calendar are not deleted when a user is deactivated or removed from the Organization. The integration record and mappings cascade away, but the calendar events remain. Consistent with the "don't touch external calendar" principle.
- **One Google account per Organization.** A unique index on `(providerAccountId, organizationId)` prevents two users in the same Organization from connecting the same Google account. Backend returns a specific error (`GOOGLE_ACCOUNT_ALREADY_CONNECTED`); UI shows a clear message. Revisit if shared-calendar workflows become a real need.
- **Connect and disconnect are Audit Events.** `connect_google_calendar` and `disconnect_google_calendar` are recorded in the audit log. Metadata includes the selected `calendarId` and `providerAccountId` (Google subject ID) — **never** access tokens, refresh tokens, or any credential material. The audit log is visible to users with `AUDIT_LOG_READ`; leaking tokens there would be a security breach.
