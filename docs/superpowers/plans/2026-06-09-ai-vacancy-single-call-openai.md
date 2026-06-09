# AI Vacancy Single-Call OpenAI Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2-stage (up-to-13-round-trip) Gemini tool-loop vacancy extraction with a single OpenAI `gpt-5.4-mini` structured-output call that has all taxonomies inlined in the system prompt, and surface extraction failures as errors instead of silent empty drafts.

**Architecture:** One `generateText` call via `@ai-sdk/openai` with `Output.object(EXTRACTION_RESULT_SCHEMA)`. A new `vacancy-ai-prompt.ts` builds the system prompt from org catalogs (areas/industries/seniorities/companies) + static catalogs (countries/languages/provinces). Files are normalized for OpenAI (PDF passthrough, TXT/DOCX → inline text). `sanitizeDraft()` + `applyDeterministicVacancyPolicy()` remain as the post-LLM safety net. The Stage-1 tool loop is deleted.

**Tech Stack:** NestJS, Vercel AI SDK (`ai` v6), `@ai-sdk/openai`, `mammoth` (DOCX text extraction), Drizzle, vitest.

**Spec:** `docs/superpowers/specs/2026-06-09-ai-vacancy-single-call-openai-design.md`

**Key context for a zero-context engineer:**
- All AI code lives in `apps/api/src/vacancy/`. The only LLM call site in the whole repo is `vacancy-ai.service.ts`.
- Tests: run from `apps/api/` with `pnpm test` (vitest). An existing example spec: `apps/api/src/vacancy/vacancy-ai-seniority.spec.ts`.
- The frontend already handles extraction errors correctly (`extractMutation.onError` in `apps/web/components/vacancies/ai-vacancy/ai-vacancy-page.tsx:177-179` shows a toast; files/prompt are only cleared on success). It never fires today because the backend returns HTTP 200 with an empty draft on failure. **No frontend changes needed** — the backend rethrow (Task 5) activates the existing path.
- The model returns `EXTRACTION_RESULT_SCHEMA` = `{ draft: AiVacancyDraftSchema, metadata: { inferredFields, unresolvedSignals } }` (defined at `vacancy-ai.service.ts:80-88`). Do not change the schema.

---

### Task 1: Dependencies and environment

**Files:**
- Modify: `apps/api/package.json` (via pnpm)
- Modify: `apps/api/.env`

- [ ] **Step 1: Swap SDK adapter and add mammoth**

```bash
cd /home/santiagoberoch/projects/hiringpeak/apps/api
pnpm add @ai-sdk/openai mammoth
pnpm remove @ai-sdk/google
```

Expected: `package.json` gains `@ai-sdk/openai` (v3.x, matching `ai` v6) and `mammoth`; `@ai-sdk/google` removed.

- [ ] **Step 2: Update env vars**

In `apps/api/.env`:
- Verify a line `OPENAI_API_KEY=sk-...` exists. **If it is missing, STOP and ask the user for the key — nothing can be end-to-end verified without it.** (Unit tests and build still work; continue tasks but flag it.)
- Change `VACANCY_AI_MODEL=gemini-3.5-flash` → `VACANCY_AI_MODEL=gpt-5.4-mini`
- Delete the `GEMINI_API_KEY=...` line.

If an `apps/api/.env.example` exists, mirror the variable changes there (placeholder values).

- [ ] **Step 3: Commit**

```bash
git add -A apps/api/package.json pnpm-lock.yaml apps/api/.env.example 2>/dev/null; git add apps/api/package.json pnpm-lock.yaml
git commit -m "chore(api): swap @ai-sdk/google for @ai-sdk/openai, add mammoth"
```

(`.env` itself is gitignored — do not force-add it.)

---

### Task 2: File normalization for OpenAI (TDD)

OpenAI accepts only PDF as a native file part. TXT must be decoded inline; DOCX must be text-extracted with mammoth.

**Files:**
- Modify: `apps/api/src/vacancy/vacancy-ai-files.ts`
- Create: `apps/api/src/vacancy/vacancy-ai-files.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/vacancy/vacancy-ai-files.spec.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async ({ buffer }: { buffer: Buffer }) => {
      if (buffer.toString('utf-8') === 'corrupt') {
        throw new Error('not a docx');
      }
      return { value: 'extracted docx text', messages: [] };
    }),
  },
}));

import { normalizeFilesForModel } from './vacancy-ai-files';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function makeFile(mimeType: string, content: string, fileName: string) {
  const buffer = Buffer.from(content, 'utf-8');
  return { buffer, mimeType, fileName, sizeBytes: buffer.length };
}

describe('normalizeFilesForModel', () => {
  it('passes PDF files through as file parts', async () => {
    const file = makeFile('application/pdf', '%PDF-1.4 fake', 'cv.pdf');
    const parts = await normalizeFilesForModel([file]);

    expect(parts).toEqual([
      { type: 'file', data: file.buffer, mediaType: 'application/pdf' },
    ]);
  });

  it('inlines TXT files as labeled text parts', async () => {
    const parts = await normalizeFilesForModel([
      makeFile('text/plain', 'hola mundo', 'notas.txt'),
    ]);

    expect(parts).toEqual([
      { type: 'text', text: 'Documento adjunto "notas.txt":\nhola mundo' },
    ]);
  });

  it('extracts DOCX files to labeled text parts via mammoth', async () => {
    const parts = await normalizeFilesForModel([
      makeFile(DOCX_MIME, 'fake docx bytes', 'perfil.docx'),
    ]);

    expect(parts).toEqual([
      { type: 'text', text: 'Documento adjunto "perfil.docx":\nextracted docx text' },
    ]);
  });

  it('throws BadRequestException naming the file when DOCX extraction fails', async () => {
    await expect(
      normalizeFilesForModel([makeFile(DOCX_MIME, 'corrupt', 'roto.docx')]),
    ).rejects.toThrow(BadRequestException);

    await expect(
      normalizeFilesForModel([makeFile(DOCX_MIME, 'corrupt', 'roto.docx')]),
    ).rejects.toThrow(/roto\.docx/);
  });

  it('preserves file order with mixed types', async () => {
    const pdf = makeFile('application/pdf', '%PDF', 'a.pdf');
    const txt = makeFile('text/plain', 'texto', 'b.txt');
    const parts = await normalizeFilesForModel([pdf, txt]);

    expect(parts[0]).toMatchObject({ type: 'file' });
    expect(parts[1]).toMatchObject({ type: 'text' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/santiagoberoch/projects/hiringpeak/apps/api
pnpm test -- vacancy-ai-files
```

Expected: FAIL — `normalizeFilesForModel` is not exported.

- [ ] **Step 3: Implement `normalizeFilesForModel`**

In `apps/api/src/vacancy/vacancy-ai-files.ts`, add at the top (below the existing import):

```typescript
import mammoth from 'mammoth';
```

And append at the end of the file:

```typescript
export type VacancyAiModelContentPart =
  | { type: 'file'; data: Buffer; mediaType: 'application/pdf' }
  | { type: 'text'; text: string };

export async function normalizeFilesForModel(
  files: VacancyAiUploadFile[],
): Promise<VacancyAiModelContentPart[]> {
  return Promise.all(
    files.map(async (file): Promise<VacancyAiModelContentPart> => {
      if (file.mimeType === 'application/pdf') {
        return {
          type: 'file',
          data: file.buffer,
          mediaType: 'application/pdf',
        };
      }

      if (file.mimeType === 'text/plain') {
        return {
          type: 'text',
          text: `Documento adjunto "${file.fileName}":\n${file.buffer.toString('utf-8')}`,
        };
      }

      try {
        const { value } = await mammoth.extractRawText({
          buffer: file.buffer,
        });

        return {
          type: 'text',
          text: `Documento adjunto "${file.fileName}":\n${value}`,
        };
      } catch {
        throw new BadRequestException(
          `No se pudo leer el archivo DOCX: ${file.fileName}`,
        );
      }
    }),
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- vacancy-ai-files
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/vacancy/vacancy-ai-files.ts apps/api/src/vacancy/vacancy-ai-files.spec.ts
git commit -m "feat(api): normalize vacancy AI uploads for OpenAI (pdf passthrough, txt/docx inline)"
```

---

### Task 3: System prompt builder with inlined catalogs (TDD)

**Files:**
- Create: `apps/api/src/vacancy/vacancy-ai-prompt.ts`
- Create: `apps/api/src/vacancy/vacancy-ai-prompt.spec.ts`

The `CatalogContext` type currently lives privately in `vacancy-ai.service.ts:91-96`. It moves here; the service will import it (Task 4).

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/vacancy/vacancy-ai-prompt.spec.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  buildExtractionSystemPrompt,
  type CatalogContext,
} from './vacancy-ai-prompt';

const catalogs: CatalogContext = {
  areas: [
    { id: 1, name: 'Comercial' },
    { id: 2, name: 'Sistemas - Tecnología' },
  ],
  industries: [{ id: 10, name: 'Retail - SMK' }],
  seniorities: [
    { id: 20, name: 'Gerente' },
    { id: 21, name: 'Director' },
  ],
  companies: [{ id: 30, name: 'Acme SA', description: 'Consumo masivo' }],
};

describe('buildExtractionSystemPrompt', () => {
  const prompt = buildExtractionSystemPrompt(catalogs);

  it('inlines every org catalog entry with its id', () => {
    expect(prompt).toContain('1: Comercial');
    expect(prompt).toContain('2: Sistemas - Tecnología');
    expect(prompt).toContain('10: Retail - SMK');
    expect(prompt).toContain('20: Gerente');
    expect(prompt).toContain('21: Director');
    expect(prompt).toContain('30: Acme SA');
  });

  it('inlines static location and language catalogs', () => {
    expect(prompt).toContain('Argentina');
    expect(prompt).toContain('Buenos Aires');
    expect(prompt).toContain('Inglés');
  });

  it('instructs the model to never invent ids', () => {
    expect(prompt.toLowerCase()).toContain('nunca inventes ids');
  });

  it('keeps the description length constraint', () => {
    expect(prompt).toContain('1500');
  });

  it('handles empty company catalogs without crashing', () => {
    const emptyPrompt = buildExtractionSystemPrompt({
      ...catalogs,
      companies: [],
    });
    expect(emptyPrompt).toContain('(sin empresas activas cargadas)');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/santiagoberoch/projects/hiringpeak/apps/api
pnpm test -- vacancy-ai-prompt
```

Expected: FAIL — module `./vacancy-ai-prompt` does not exist.

- [ ] **Step 3: Implement the prompt builder**

Create `apps/api/src/vacancy/vacancy-ai-prompt.ts`:

```typescript
import {
  countries,
  languages,
  provinceGroups,
} from '@workspace/shared/static/catalogs';
import type { IdCatalogOption } from './vacancy-ai.matcher';

export const VACANCY_AI_DESCRIPTION_MAX_LENGTH = 1500;

export type CatalogContext = {
  areas: IdCatalogOption[];
  companies: Array<IdCatalogOption & { description?: string | null }>;
  industries: IdCatalogOption[];
  seniorities: IdCatalogOption[];
};

function formatIdCatalog(items: IdCatalogOption[], emptyLabel: string) {
  if (items.length === 0) {
    return emptyLabel;
  }

  return items.map((item) => `- ${item.id}: ${item.name}`).join('\n');
}

function formatCompanyCatalog(companies: CatalogContext['companies']) {
  if (companies.length === 0) {
    return '(sin empresas activas cargadas)';
  }

  return companies
    .map((company) => {
      const description = company.description?.trim();
      return description
        ? `- ${company.id}: ${company.name} — ${description}`
        : `- ${company.id}: ${company.name}`;
    })
    .join('\n');
}

function buildDescriptionGuidelines() {
  return `
Descripción (campo description):
- Redacta un breve perfil de la vacante en lenguaje formal y profesional (tono de usted).
- Debe ser un texto útil para publicar o compartir la búsqueda: rol u objetivo, competencias o habilidades esperadas, y requisitos clave inferidos del prompt.
- Incorpora de forma natural, solo si los resolviste: rango de experiencia (seniority), idiomas, país y provincia.
- Evita listas extensas de viñetas; prefiere uno o dos párrafos breves y, como máximo, una lista corta de 3 a 5 ítems.
- Máximo ${VACANCY_AI_DESCRIPTION_MAX_LENGTH} caracteres.
- No repitas el título literalmente; complétalo.
- No inventes ubicación, idiomas, experiencia ni competencias que no estén respaldadas por el prompt o los documentos.`;
}

function buildSeniorityGuidelines() {
  return `
Seniority (filters.seniorityIds):
- Es casi siempre inferible del cargo o título aunque el usuario no diga "seniority" explícitamente.
- Sé agresivo al mapear señales de liderazgo y trayectoria al catálogo. "Vasta/amplia trayectoria", "liderar equipos", "responsable del área", "estrategia", "reporta al CEO/directorio" suelen implicar Gerente, Director o superior.
- Guía de niveles (elige los ids del catálogo de seniorities que mejor encajen):
  * Ejecutivo / C-level (CEO, CFO, CTO, CMO, COO, presidente, vicepresidente, socio): opciones más altas del catálogo.
  * Gerente, manager, jefe de área/equipo, supervisor: banda gerencial.
  * Team lead, coordinador, líder de equipo: banda de liderazgo intermedio.
  * Analista, especialista, asistente ejecutivo/a: banda media.
  * Junior, semi senior: banda junior.
  * Data entry, carga de datos, trainee, pasante, practicante, auxiliar administrativo, recepcionista: el nivel más bajo disponible.
- Ejemplos: "gerente comercial" → Gerente o superior; "CEO" → CEO/Director; "data entry" → nivel más bajo disponible.`;
}

export function buildExtractionSystemPrompt(catalogs: CatalogContext) {
  const provinceLines = provinceGroups
    .map((group) => `- ${group.country}: ${group.provinces.join(', ')}`)
    .join('\n');

  return `
Eres un extractor de vacantes para un ATS. A partir del prompt del usuario y los documentos adjuntos produces un borrador estructurado de la vacante.

Reglas:
- filters siempre debe existir en la respuesta.
- Haz el mejor esfuerzo para inferir title y description aunque el usuario no los exprese literalmente.
- Para seniorityIds, areaIds, industryIds y companyId usa EXCLUSIVAMENTE ids de los catálogos listados abajo. Nunca inventes ids.
- Para countries, provinces y languages usa EXCLUSIVAMENTE los nombres listados abajo, escritos exactamente igual.
- companyId es opcional y conservador: complétalo solo si el prompt o los documentos nombran una empresa que coincide claramente con una del catálogo. Si la empresa tiene descripción en el catálogo, úsala como señal para industryIds.
- Interpreta listas con "y" u "o" como arreglos OR. Nunca conviertas eso en lógica AND estructurada.
- Si un dato no está respaldado por el prompt o los documentos, déjalo vacío.
- assignedTo y statusId NO forman parte de esta extracción.
${buildSeniorityGuidelines()}
${buildDescriptionGuidelines()}

Metadata:
- metadata.inferredFields: nombres de los campos que inferiste sin mención explícita del usuario.
- metadata.unresolvedSignals: señales del prompt que no pudiste mapear a ningún catálogo.

Catálogo de seniorities (id: nombre):
${formatIdCatalog(catalogs.seniorities, '(sin seniorities cargados)')}

Catálogo de áreas (id: nombre):
${formatIdCatalog(catalogs.areas, '(sin áreas cargadas)')}

Catálogo de industrias (id: nombre):
${formatIdCatalog(catalogs.industries, '(sin industrias cargadas)')}

Empresas activas de la organización (id: nombre — descripción):
${formatCompanyCatalog(catalogs.companies)}

Países permitidos:
${countries.map((country) => country.name).join(', ')}

Idiomas permitidos:
${languages.map((language) => language.name).join(', ')}

Provincias permitidas por país:
${provinceLines}
`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- vacancy-ai-prompt
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/vacancy/vacancy-ai-prompt.ts apps/api/src/vacancy/vacancy-ai-prompt.spec.ts
git commit -m "feat(api): build single-call extraction system prompt with inlined catalogs"
```

---

### Task 4: Rewrite `extract()` as a single OpenAI call

**Files:**
- Modify: `apps/api/src/vacancy/vacancy-ai.service.ts`

This task only swaps the pipeline inside `extract()` and fixes imports enough to compile. Dead-code deletion is Task 5 (separate commit so the diff stays reviewable).

- [ ] **Step 1: Update imports**

In `apps/api/src/vacancy/vacancy-ai.service.ts`:

Replace lines 1-17 (`@nestjs/common`, `ai`, `@ai-sdk/google` imports):

```typescript
import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, Output } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
```

Replace the `vacancy-ai-files` import block (lines 61-66):

```typescript
import {
  assertExtractHasInput,
  buildExtractionPromptText,
  normalizeFilesForModel,
  resolveSourceType,
} from './vacancy-ai-files';
```

Replace the `vacancy-ai-seniority` import block (lines 67-72):

```typescript
import {
  inferSeniorityBandFromText,
  resolveSeniorityIdsFromInference,
} from './vacancy-ai-seniority';
```

Replace the matcher import block (lines 54-59):

```typescript
import { searchIdCatalog, type IdCatalogOption } from './vacancy-ai.matcher';
```

Add the prompt-module import after the matcher import:

```typescript
import {
  buildExtractionSystemPrompt,
  VACANCY_AI_DESCRIPTION_MAX_LENGTH,
  type CatalogContext,
} from './vacancy-ai-prompt';
```

Then delete the now-duplicated local definitions:
- `const VACANCY_AI_DESCRIPTION_MAX_LENGTH = 1500;` (line 74)
- the `type CatalogContext = {...}` block (lines 91-96)

Note: `IdCatalogOption` stays imported — it is still used by `resolveCatalogNames`/`inferSingleCatalogIdFromTexts` (and `resolveCatalogNames` is deleted in Task 5; `inferSingleCatalogIdFromTexts` stays).

- [ ] **Step 2: Replace the body of `extract()`**

Replace the entire `extract()` method (currently lines 711-856) with:

```typescript
  async extract(
    params: ExtractVacancyAiServiceParams,
  ): Promise<ExtractVacancyAiResponse> {
    const files = params.files ?? [];
    const userPrompt = params.userPrompt?.trim() || undefined;
    assertExtractHasInput(userPrompt, files);

    const sourceType = resolveSourceType(userPrompt, files);
    const promptText = buildExtractionPromptText(userPrompt, files);
    const documentInputs = files.map((file, index) => ({
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      sortOrder: index,
    }));
    const fileParts = await normalizeFilesForModel(files);

    const publicToken = crypto.randomUUID();
    const startedAt = Date.now();
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const modelName =
      this.configService.get<string>('VACANCY_AI_MODEL') ?? 'gpt-5.4-mini';
    const openai = createOpenAI(apiKey ? { apiKey } : {});
    const catalogs = await this.loadCatalogContext(params.organizationId);

    try {
      const result = await generateText({
        model: openai(modelName),
        system: buildExtractionSystemPrompt(catalogs),
        messages: [
          {
            role: 'user',
            content: [...fileParts, { type: 'text', text: promptText }],
          },
        ],
        output: Output.object({
          schema: EXTRACTION_RESULT_SCHEMA,
          name: 'vacancy_draft_extraction',
          description: 'Structured vacancy draft extraction result',
        }),
      });

      const sanitizedDraft = applyDeterministicVacancyPolicy(
        sanitizeDraft(result.output.draft, catalogs),
        catalogs,
        promptText,
      );
      this.logger.debug({
        model: modelName,
        publicToken,
        usage: result.usage,
      });

      const latencyMs = Date.now() - startedAt;

      await this.vacancyAiAnalyticsService.createRun({
        publicToken,
        organizationId: params.organizationId,
        userId: params.userId,
        prompt: promptText,
        sourceType,
        userPrompt: userPrompt ?? null,
        model: modelName,
        status: 'succeeded',
        responseText: result.text,
        draft: sanitizedDraft,
        documents: documentInputs,
        extractionMetadata: toJsonValue({
          finalMetadata: result.output.metadata,
          documentCount: files.length,
        }),
        totalUsage: toJsonValue({ extraction: result.usage }),
        latencyMs,
      });

      return {
        token: publicToken,
        draft: sanitizedDraft,
      };
    } catch (error) {
      this.logger.error(
        `Vacancy AI extraction failed for token ${publicToken}`,
        error instanceof Error ? error.stack : undefined,
      );
      const latencyMs = Date.now() - startedAt;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown extraction error';

      await this.vacancyAiAnalyticsService.createRun({
        publicToken,
        organizationId: params.organizationId,
        userId: params.userId,
        prompt: promptText,
        sourceType,
        userPrompt: userPrompt ?? null,
        model: modelName,
        status: 'failed',
        draft: createEmptyDraft(),
        documents: documentInputs,
        errorMessage,
        latencyMs,
      });

      throw new BadGatewayException(
        'No se pudo generar el borrador con IA. Intenta nuevamente.',
      );
    }
  }
```

Behavior notes baked into this code:
- `normalizeFilesForModel` runs **before** the try block: a corrupt DOCX is the user's error → `BadRequestException` (400), no analytics "failed" run.
- LLM/parse failures now **rethrow** as 502 after recording the failed run. The old code returned `{ token, draft: { filters: {} } }` with HTTP 200 — that was the "not working at all" symptom.
- `messages` is used for both prompt-only and with-files cases (with no files, `fileParts` is `[]`), eliminating the old two-branch call.

- [ ] **Step 3: Verify compile state**

```bash
cd /home/santiagoberoch/projects/hiringpeak/apps/api
pnpm exec tsc --noEmit -p tsconfig.json
```

Expected: errors ONLY about now-unused declarations (`buildContextTools`, `buildLookupTools`, `formatResolvedFiltersSummary`, etc. — removed in Task 5) IF `noUnusedLocals` is enabled; otherwise clean. There must be NO errors inside the new `extract()` body or imports. If `result.output` does not typecheck against `ai` v6 (API drift), check the installed version's docs — the previous code used the same `output: Output.object(...)` / `result.output` pattern, so it should carry over unchanged.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/vacancy/vacancy-ai.service.ts
git commit -m "feat(api): single-call OpenAI vacancy extraction with inlined catalogs, surface failures as 502"
```

---

### Task 5: Delete the dead tool-loop code

**Files:**
- Modify: `apps/api/src/vacancy/vacancy-ai.service.ts`
- Modify: `apps/api/src/vacancy/vacancy-ai-seniority.ts`
- Possibly modify: `apps/api/src/vacancy/vacancy-ai-seniority.spec.ts`

- [ ] **Step 1: Delete dead functions from `vacancy-ai.service.ts`**

Delete these top-level declarations entirely (line numbers from before Task 4 edits — locate by name, not number):
- `const SUBMIT_DRAFT_CONTEXT_TOOL` (old line 89)
- `resolveCatalogNames()` (174-188)
- `formatResolvedFiltersSummary()` (190-248)
- `buildDescriptionGuidelines()` (250-260) — moved into `vacancy-ai-prompt.ts`
- `combineUsage()` (555-589)
- `buildStage1UserMessage()` (591-609)
- `buildContextGenerationPrompt()` (611-646)
- `buildStructuredExtractionPrompt()` (648-682)
- `getSubmittedDraftContext()` (684-698)
- Class methods `buildContextTools()` (1093-1104), `buildLookupTools()` (~1106-1263), and `getCompanyInferenceContext()` (~1265-1381)

Keep: `createEmptyDraft`, `toJsonValue`/`isJsonObject`, all `normalize*`/`clamp*`/`unique*`/`filterAllowed*` helpers, `sanitizeDraft`, `findCompanyContext`, `buildInferenceText`, `inferSingleCatalogIdFromTexts`, `isMidSeniorityOrHigher`, `applyDeterministicVacancyPolicy`, `loadCatalogContext`, and everything in `create()`/`listRuns()`/`findRunByToken()`/`findAiSourceForVacancy()`.

- [ ] **Step 2: Delete dead helpers from `vacancy-ai-seniority.ts`**

First confirm they are unused outside their own file and its spec:

```bash
cd /home/santiagoberoch/projects/hiringpeak
grep -rn "senioritySearchQueriesForBand\|buildSeniorityInferenceGuidelines" apps packages --include="*.ts" | grep -v node_modules
```

Expected: hits only in `vacancy-ai-seniority.ts` and possibly `vacancy-ai-seniority.spec.ts`. If so, delete `buildSeniorityInferenceGuidelines()` and `senioritySearchQueriesForBand()` from `vacancy-ai-seniority.ts` and any tests covering them in the spec file. If there are other call sites, leave the functions in place and note it.

- [ ] **Step 3: Typecheck, lint, and full test run**

```bash
cd /home/santiagoberoch/projects/hiringpeak/apps/api
pnpm exec tsc --noEmit -p tsconfig.json
pnpm test
pnpm lint 2>/dev/null || true
```

Expected: tsc clean, all vitest suites pass (including the new `vacancy-ai-files` and `vacancy-ai-prompt` specs and the existing `vacancy-ai-seniority` spec).

- [ ] **Step 4: Verify no Gemini remnants**

```bash
cd /home/santiagoberoch/projects/hiringpeak
grep -rn "ai-sdk/google\|GEMINI\|gemini" apps/api/src --include="*.ts"
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/vacancy/
git commit -m "refactor(api): remove Gemini tool-loop extraction pipeline"
```

---

### Task 6: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Build the API**

```bash
cd /home/santiagoberoch/projects/hiringpeak/apps/api
pnpm build
```

Expected: build succeeds.

- [ ] **Step 2: Manual smoke test** (requires `OPENAI_API_KEY` in `apps/api/.env` and the dev stack running)

Start the dev stack (repo root: `pnpm dev`, or the project's usual command), open the AI vacancy page in the web app, and run three extractions:
1. **Prompt only:** e.g. "Buscamos un gerente comercial para una empresa de consumo masivo en Córdoba, inglés avanzado". Verify: title + description generated; seniority resolves to "Gerente" (or higher); area "Comercial"; province "Córdoba"; languages include "Inglés".
2. **PDF upload:** any job-description PDF. Verify a coherent draft is produced.
3. **Failure path:** temporarily set `VACANCY_AI_MODEL=nonexistent-model` in `.env`, restart the API, submit a prompt. Verify the UI shows the error toast ("No se pudo generar el borrador.") and stays on the prompt screen with the prompt intact — NOT an empty draft with a success toast. Restore `VACANCY_AI_MODEL=gpt-5.4-mini` afterwards and restart.

- [ ] **Step 3: Check latency/usage in analytics**

In the AI vacancy page history sidebar (or `GET /vacancy/ai/runs`), confirm the new runs show `status: succeeded` and that latency is noticeably lower than old runs (single call vs. up-to-13 round-trips).

---

## Self-review notes

- **Spec coverage:** single call + inlined catalogs (Tasks 3-4), provider swap (Tasks 1, 4), file normalization with mammoth (Task 2), error surfacing as 502 (Task 4), tool-loop deletion (Task 5), kept `sanitizeDraft`/deterministic policy (Task 4 reuses them untouched), env changes (Task 1), testing section (Tasks 2, 3, 5, 6). Frontend error UI: spec called for a change, but investigation showed `onError` handling already exists and only needed the backend to stop masking failures — recorded in "Key context".
- **Type consistency:** `CatalogContext` and `VACANCY_AI_DESCRIPTION_MAX_LENGTH` move to `vacancy-ai-prompt.ts` (Task 3) and are imported by the service (Task 4 Step 1, which also deletes the local copies). `normalizeFilesForModel` defined in Task 2, consumed in Task 4. `BadGatewayException` imported in Task 4 Step 1, used in Step 2.
