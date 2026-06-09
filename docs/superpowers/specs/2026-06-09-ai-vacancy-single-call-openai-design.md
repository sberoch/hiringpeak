# AI Vacancy Creation — Single-Call Extraction on OpenAI

**Date:** 2026-06-09
**Status:** Approved approach (A + `gpt-5.4-mini`), pending spec review

## Problem

The "create vacancy with AI" flow (`apps/api/src/vacancy/vacancy-ai.service.ts`) is broken and over-engineered:

1. **Broken:** `apps/api/.env` sets `VACANCY_AI_MODEL=gemini-3.5-flash`, a model ID that does not exist, so every extraction fails. The `catch` in `extract()` swallows the error and returns an empty draft with HTTP 200, so the UI shows "nothing extracted" with no error.
2. **Too many calls:** Stage 1 is an agentic tool loop (up to 12 sequential model round-trips calling `findAreas`, `findSeniorities`, `findIndustries`, `findCompanies`, `findCountries`, `findProvinces`, `findLanguages`, `getCompanyInferenceContext`, `submitDraftContext`), followed by a Stage 2 structured-extraction call. Up to 13 round-trips per extraction.
3. The taxonomies the tool loop searches are tiny: 18 areas, 16 industries, 5 seniorities, 22 countries, 20 languages, 22 province groups, plus per-org active companies. The full catalog fits in ~1–2k tokens of prompt.

## Design

### One LLM call, catalogs inlined

Replace both stages with a single `generateText` call using the existing Vercel AI SDK:

- **Provider:** `@ai-sdk/openai` (replaces `@ai-sdk/google`, which has no other consumers in the repo).
- **Model:** `VACANCY_AI_MODEL` env var, default `gpt-5.4-mini` (verified real: released 2026-03-17, 400K context, file/image input support).
- **API key:** `OPENAI_API_KEY` env var. `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` lookups removed.
- **Output:** `Output.object` with the existing `EXTRACTION_RESULT_SCHEMA` (unchanged).
- **System prompt:** new `buildExtractionSystemPrompt(catalogs)` that inlines every catalog as `id — name` lists:
  - Seniorities, areas, industries, active companies (org-scoped, from `loadCatalogContext()`)
  - Countries, languages, provinces grouped by country (static JSON catalogs)
  - Keeps the existing rules: never invent IDs, only use listed IDs, OR-semantics for "y"/"o" lists, leave missing fields empty, `filters` always present, `assignedTo`/`statusId` out of scope, conservative company matching, plus the existing description guidelines (`buildDescriptionGuidelines()`).
- **User message:** uploaded files + `buildExtractionPromptText()` output (unchanged shape).

### Deleted

- The entire Stage 1 tool loop: `buildContextTools()`, `buildLookupTools()`, `buildContextGenerationPrompt()`, `buildStage1UserMessage()`, `submitDraftContext` handling, `stopWhen`/step-count logic, `getCompanyInferenceContext()` and its tool.
- Stage 2's separate call and `buildStructuredExtractionPrompt()` (its instructions merge into the single system prompt; `formatResolvedFiltersSummary` is no longer needed pre-call).

### Kept

- `sanitizeDraft()` — validates every returned ID/string against real catalogs (safety net against hallucinated IDs).
- `applyDeterministicVacancyPolicy()` — fallback inference (seniority regex, single-catalog matches, minStars 3.5 default, Argentina/Buenos Aires default, language inference). The fuzzy matcher (`vacancy-ai.matcher.ts`) survives only as the engine behind these fallbacks.
- Analytics runs (`vacancyAiAnalyticsService`), token-usage accounting (now a single usage record), the public token flow, and the `create()` endpoint unchanged.

### File handling

OpenAI accepts only PDF as a native file part, so normalize uploads before building the user message:

| Type | Handling |
|------|----------|
| PDF | Pass through as `type: 'file'` part (unchanged) |
| TXT | Decode buffer to UTF-8, inline as a text part labeled with the filename |
| DOCX | Extract text server-side with `mammoth` (new dependency), inline as a labeled text part |

Allowed upload types and limits in `vacancy-ai-files.ts` stay unchanged. If DOCX extraction fails, return a 400 naming the file.

### Error handling (the "silent empty draft" fix)

- `extract()` still records a `failed` analytics run on error, but then **rethrows** as a 502 (`BadGatewayException` with a generic "AI extraction failed" message) instead of returning an empty draft.
- Frontend (`ai-vacancy-page.tsx` / `extractMutation`): on error, stay on the prompt screen, show a destructive toast/inline error with the message and keep the prompt + files so the user can retry. No new retry machinery — re-submitting is the retry.

### Config changes

- `apps/api/.env`: add `OPENAI_API_KEY`, set `VACANCY_AI_MODEL=gpt-5.4-mini`, remove `GEMINI_API_KEY`.
- `package.json` (api): add `@ai-sdk/openai`, `mammoth`; remove `@ai-sdk/google`.

## Out of scope

- The commented-out feature-flag guard on `/vacancy/ai/extract` (left as is).
- Any changes to the create/persist flow, candidate selection, or the wizard UI beyond the error state.
- Retries/streaming — single attempt remains the behavior, but now with a visible error.

## Testing

- Unit: prompt builder includes all catalog entries with correct IDs; file normalization (PDF passthrough, TXT decode, DOCX extraction, corrupt DOCX → 400).
- Existing `sanitizeDraft` / deterministic-policy tests unchanged (logic untouched).
- Manual: extract from prompt-only, PDF, DOCX; verify resolved IDs match catalogs; verify an invalid API key now surfaces an error in the UI instead of an empty draft.
