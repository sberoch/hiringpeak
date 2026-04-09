"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeading } from "@workspace/ui/components/page-heading";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Textarea } from "@workspace/ui/components/textarea";
import { CandidatePicker } from "@/components/vacancies/candidate-picker";
import { AiVacancyFiltersEditor } from "./ai-vacancy-filters-editor";
import {
  CANDIDATE_API_KEY,
  getAllCandidates,
} from "@/lib/api/candidate";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { USERS_API_KEY, getAllUsers } from "@/lib/api/user";
import {
  createVacancyWithAi,
  extractVacancyWithAi,
  VACANCY_AI_API_KEY,
} from "@/lib/api/vacancy-ai";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { aiDraftToCandidateParams, normalizeAiVacancyDraft } from "@/lib/vacancy-ai";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { AiVacancyDraft } from "@workspace/shared/types/vacancy-ai";

const EXAMPLE_PROMPTS = [
  "Busco gerente comercial para retail en Argentina, seniority gerente, experiencia en consumo masivo, inglés, foco en expansión regional.",
  "Necesito una directora de finanzas para industria farma, liderazgo regional, español e inglés, base en Buenos Aires.",
  "Quiero un jefe de logística para industria automotriz en Córdoba, con equipos a cargo y experiencia en planta.",
];

function hasSelectedCompany(draft: AiVacancyDraft | null) {
  return draft?.companyId != null;
}

function CandidatePanelSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-brand-border bg-surface"
        >
          <div className="flex">
            <div className="h-40 w-24 shrink-0 bg-brand-border-light" />
            <div className="flex-1 space-y-3 p-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AiVacancyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<AiVacancyDraft | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [statusId, setStatusId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const candidateParams = useMemo(() => {
    if (!draft) {
      return null;
    }

    return {
      ...aiDraftToCandidateParams(draft),
      limit: 12,
      page: 1,
    };
  }, [draft]);

  const { data: candidates, isFetching: isFetchingCandidates } = useQuery({
    queryKey: [CANDIDATE_API_KEY, "ai-preview", candidateParams],
    queryFn: () => {
      if (!candidateParams) {
        throw new Error("Candidate params are required");
      }

      return getAllCandidates(candidateParams);
    },
    enabled: candidateParams !== null,
  });

  const { data: companiesData } = useQuery({
    queryKey: [
      COMPANIES_API_KEY,
      { limit: 1e9, page: 1, status: CompanyStatusEnum.ACTIVE },
    ],
    queryFn: () =>
      getAllCompanies({
        limit: 1e9,
        page: 1,
        status: CompanyStatusEnum.ACTIVE,
      }),
  });

  const { data: usersData } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
  });

  const { data: statusesData } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1e9, page: 1 }),
  });

  const extractMutation = useMutation({
    mutationFn: (nextPrompt: string) => extractVacancyWithAi(nextPrompt),
    onSuccess: (response) => {
      const normalizedDraft = normalizeAiVacancyDraft(response.draft);

      setToken(response.token);
      setDraft(normalizedDraft);
      setSelectedCandidateIds([]);
      setStatusId("");
      setAssignedTo("");
      toast.success("Borrador generado. Revísalo antes de guardar.");
    },
    onError: () => {
      toast.error("No se pudo generar el borrador.");
    },
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!draft || !token || draft.companyId == null) {
        throw new Error("Draft, token and company are required");
      }

      return createVacancyWithAi({
        token,
        draft,
        companyId: draft.companyId,
        statusId: Number(statusId),
        assignedTo: Number(assignedTo),
        selectedCandidateIds,
      });
    },
    onSuccess: (vacancy) => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [VACANCY_AI_API_KEY] });
      toast.success("Vacante creada correctamente");
      router.push(`/vacancies/${vacancy.id}`);
    },
    onError: () => {
      toast.error("No se pudo crear la vacante.");
    },
  });

  const isReadyToCreate =
    draft !== null &&
    token !== null &&
    (draft.title?.trim().length ?? 0) > 0 &&
    hasSelectedCompany(draft) &&
    statusId.length > 0 &&
    assignedTo.length > 0 &&
    selectedCandidateIds.length > 0;

  function updateDraft(updater: (currentDraft: AiVacancyDraft) => AiVacancyDraft) {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      return updater(currentDraft);
    });
  }

  function handlePromptSubmit() {
    if (prompt.trim().length === 0) {
      toast.error("Escribe un prompt antes de continuar.");
      return;
    }

    extractMutation.mutate(prompt.trim());
  }

  function handleFilterChange(nextFilters: AiVacancyDraft["filters"]) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      filters: nextFilters,
    }));
    setSelectedCandidateIds([]);
  }

  function toggleCandidateSelection(candidateId: number) {
    setSelectedCandidateIds((currentSelection) =>
      currentSelection.includes(candidateId)
        ? currentSelection.filter((id) => id !== candidateId)
        : [...currentSelection, candidateId],
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      <div className="flex items-center justify-between gap-4">
        <PageHeading
          icon={Sparkles}
          title="Crear vacante con IA"
          description="Redacta lo que necesitas y conviértelo en un borrador editable con candidatos sugeridos."
        />
        <Button asChild variant="outline">
          <Link href="/vacancies">Volver a vacantes</Link>
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-electric/20 bg-[#101218] text-white shadow-[0_20px_60px_-30px_rgba(0,102,255,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,102,255,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1.25fr_280px] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Prompt to draft
            </div>
            <div className="space-y-2">
              <h2 className="max-w-3xl text-3xl font-bold leading-tight text-white">
                Describe la vacante como la imaginas y deja que el sistema arme el primer recorte.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-white/70">
                El resultado es un borrador. Puedes cambiar filtros, ajustar título y descripción, y seleccionar los candidatos antes de crear la vacante definitiva.
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="vacancy-ai-prompt" className="text-white/80">
                Qué estás buscando
              </Label>
              <Textarea
                id="vacancy-ai-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ej: Busco gerente comercial para retail en Buenos Aires, con inglés, experiencia en consumo masivo y liderazgo regional."
                className="min-h-[160px] rounded-2xl border-white/10 bg-black/20 text-base text-white placeholder:text-white/35 focus-visible:border-electric focus-visible:ring-electric/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((examplePrompt) => (
                <Button
                  key={examplePrompt}
                  type="button"
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => setPrompt(examplePrompt)}
                >
                  {examplePrompt}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                className="rounded-md bg-white text-black hover:bg-white/90"
                disabled={extractMutation.isPending}
                onClick={handlePromptSubmit}
              >
                {extractMutation.isPending ? "Generando borrador..." : "Generar borrador"}
              </Button>
              <p className="text-sm text-white/60">
                Modificar filtros reinicia la selección de candidatos para mantener el borrador consistente.
              </p>
            </div>
          </div>

          <div className="flex items-end justify-center lg:justify-end">
            <div className="relative w-full max-w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="space-y-3">
                <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                  Primera pasada
                </Badge>
                <div>
                  <div className="text-sm text-white/65">Paso 1</div>
                  <div className="text-lg font-semibold">Prompt y extracción</div>
                </div>
                <div>
                  <div className="text-sm text-white/65">Paso 2</div>
                  <div className="text-lg font-semibold">Preview y selección</div>
                </div>
                <div>
                  <div className="text-sm text-white/65">Paso 3</div>
                  <div className="text-lg font-semibold">Confirmación final</div>
                </div>
              </div>
              <Image
                src="/images/search.png"
                alt="Vista previa de búsqueda"
                width={220}
                height={220}
                className="mt-6 h-auto w-full rounded-xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {draft ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="rounded-2xl border-brand-border bg-surface">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-ink">
                  Borrador editable
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ai-vacancy-title">Título</Label>
                  <Input
                    id="ai-vacancy-title"
                    value={draft.title ?? ""}
                    onChange={(event) =>
                      updateDraft((currentDraft) => ({
                        ...currentDraft,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Título de la vacante"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-vacancy-salary">Compensación</Label>
                  <Input
                    id="ai-vacancy-salary"
                    value={draft.salary ?? ""}
                    onChange={(event) =>
                      updateDraft((currentDraft) => ({
                        ...currentDraft,
                        salary: event.target.value,
                      }))
                    }
                    placeholder="$10,000,000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-vacancy-description">Descripción</Label>
                  <Textarea
                    id="ai-vacancy-description"
                    className="min-h-[140px]"
                    value={draft.description ?? ""}
                    onChange={(event) =>
                      updateDraft((currentDraft) => ({
                        ...currentDraft,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Describe el rol, el contexto y lo que esperas del perfil."
                  />
                </div>
              </CardContent>
            </Card>

            <AiVacancyFiltersEditor
              filters={draft.filters}
              onChange={handleFilterChange}
            />

            <Card className="rounded-2xl border-brand-border bg-surface">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-ink">
                  Confirmación manual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select
                    value={draft.companyId?.toString() ?? ""}
                    onValueChange={(value) =>
                      updateDraft((currentDraft) => ({
                        ...currentDraft,
                        companyId: Number(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companiesData?.items.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={statusId} onValueChange={setStatusId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusesData?.items.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Asignado a</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {usersData?.items.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name ?? user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-xl border border-brand-border bg-canvas/60 p-3 text-sm text-slate-brand">
                  El borrador puede salir incompleto. Antes de guardar, confirma empresa, estado, responsable y al menos un candidato seleccionado.
                </div>

                <Button
                  type="button"
                  className="w-full rounded-md"
                  disabled={!isReadyToCreate || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending
                    ? "Creando vacante..."
                    : `Crear vacante con ${selectedCandidateIds.length} candidato${selectedCandidateIds.length === 1 ? "" : "s"}`}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-brand-border bg-surface">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold text-ink">
                    Primera página de candidatos
                  </CardTitle>
                  <p className="text-sm text-slate-brand">
                    La búsqueda se actualiza automáticamente con el borrador actual.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">
                    <Users className="mr-1 h-3.5 w-3.5" />
                    {candidates?.meta.totalItems ?? 0} encontrados
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    <BriefcaseBusiness className="mr-1 h-3.5 w-3.5" />
                    {selectedCandidateIds.length} seleccionados
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isFetchingCandidates && !candidates ? (
                <CandidatePanelSkeleton />
              ) : (
                <CandidatePicker
                  candidates={candidates?.items ?? []}
                  selectedCandidates={selectedCandidateIds}
                  toggleCandidateSelection={toggleCandidateSelection}
                />
              )}
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-brand-border bg-surface px-6 py-12">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
            <Image
              src="/images/stat-search.png"
              alt="Exploración de candidatos"
              width={240}
              height={160}
              className="h-auto w-[220px]"
            />
            <h2 className="text-2xl font-semibold text-ink">
              Genera un borrador y empieza a recortar el universo de candidatos.
            </h2>
            <p className="text-sm leading-6 text-slate-brand">
              Cuanto más contexto pongas en el prompt, mejor será la primera sugerencia. Después puedes ajustar filtros, corregir texto y confirmar los datos finales.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

