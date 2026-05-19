"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AiVacancyAgentLayout } from "./ai-vacancy-agent-layout";
import { AiVacancyCandidatesSection } from "./ai-vacancy-candidates-section";
import { AiVacancyDraftFieldsSection } from "./ai-vacancy-draft-fields";
import { AiVacancyFiltersEditor } from "./ai-vacancy-filters-editor";
import { AiVacancyManualConfirmSection } from "./ai-vacancy-manual-confirm";
import { AiVacancyPromptLanding } from "./ai-vacancy-prompt-landing";
import { AiVacancyPromptPane } from "./ai-vacancy-prompt-pane";
import { AiVacancyReviewEmpty } from "./ai-vacancy-review-empty";
import { AiVacancyReviewLoading } from "./ai-vacancy-review-loading";
import { AiVacancyShell } from "./ai-vacancy-shell";
import { useSidebar } from "@workspace/ui/components/sidebar";
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

function hasSelectedCompany(draft: AiVacancyDraft | null) {
  return draft?.companyId != null;
}

export function AiVacancyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setOpen } = useSidebar();
  const [hasStarted, setHasStarted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<AiVacancyDraft | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [statusId, setStatusId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const hasDraft = draft !== null;

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
    enabled: hasDraft,
  });

  const { data: usersData } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
    enabled: hasDraft,
  });

  const { data: statusesData } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1e9, page: 1 }),
    enabled: hasDraft,
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

  const updateDraft = useCallback(
    (updater: (currentDraft: AiVacancyDraft) => AiVacancyDraft) => {
      setDraft((currentDraft) => {
        if (!currentDraft) {
          return currentDraft;
        }

        return updater(currentDraft);
      });
    },
    [],
  );

  const handlePromptSubmit = useCallback(() => {
    if (prompt.trim().length === 0) {
      toast.error("Escribe un prompt antes de continuar.");
      return;
    }

    if (!hasStarted) {
      setOpen(false);
      setHasStarted(true);
    }

    extractMutation.mutate(prompt.trim());
  }, [extractMutation, hasStarted, prompt, setOpen]);

  const handleFilterChange = useCallback(
    (nextFilters: AiVacancyDraft["filters"]) => {
      updateDraft((currentDraft) => ({
        ...currentDraft,
        filters: nextFilters,
      }));
      setSelectedCandidateIds([]);
    },
    [updateDraft],
  );

  const toggleCandidateSelection = useCallback((candidateId: number) => {
    setSelectedCandidateIds((currentSelection) =>
      currentSelection.includes(candidateId)
        ? currentSelection.filter((id) => id !== candidateId)
        : [...currentSelection, candidateId],
    );
  }, []);

  const isWorkspace = hasStarted;

  const reviewPane = draft ? (
    <div className="rounded-2xl border border-brand-border bg-surface lg:m-4 lg:overflow-hidden">
      <AiVacancyDraftFieldsSection draft={draft} onUpdate={updateDraft} />
      <AiVacancyFiltersEditor filters={draft.filters} onChange={handleFilterChange} />
      <AiVacancyManualConfirmSection
        draft={draft}
        companies={companiesData?.items ?? []}
        users={usersData?.items ?? []}
        statuses={statusesData?.items ?? []}
        statusId={statusId}
        assignedTo={assignedTo}
        selectedCount={selectedCandidateIds.length}
        isReadyToCreate={isReadyToCreate}
        isCreating={createMutation.isPending}
        onDraftUpdate={updateDraft}
        onStatusChange={setStatusId}
        onAssignedToChange={setAssignedTo}
        onCreate={() => createMutation.mutate()}
      />
      <AiVacancyCandidatesSection
        candidates={candidates?.items ?? []}
        totalItems={candidates?.meta.totalItems ?? 0}
        selectedCandidateIds={selectedCandidateIds}
        isLoading={isFetchingCandidates}
        onToggleSelection={toggleCandidateSelection}
      />
    </div>
  ) : extractMutation.isPending ? (
    <AiVacancyReviewLoading />
  ) : (
    <AiVacancyReviewEmpty />
  );

  return (
    <AiVacancyShell>
      {isWorkspace ? (
        <AiVacancyAgentLayout
          promptPane={
            <AiVacancyPromptPane
              prompt={prompt}
              onPromptChange={setPrompt}
              onSubmit={handlePromptSubmit}
              isGenerating={extractMutation.isPending}
            />
          }
          reviewPane={reviewPane}
        />
      ) : (
        <AiVacancyPromptLanding
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handlePromptSubmit}
          isGenerating={extractMutation.isPending}
        />
      )}
    </AiVacancyShell>
  );
}
