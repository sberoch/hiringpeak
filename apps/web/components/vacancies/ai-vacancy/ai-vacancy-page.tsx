"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AiVacancyAgentLayout } from "./ai-vacancy-agent-layout";
import { AiVacancyPageLayout } from "./ai-vacancy-page-layout";
import { AiVacancyCandidatesSection } from "./ai-vacancy-candidates-section";
import { AiVacancyDraftFieldsSection } from "./ai-vacancy-draft-fields";
import { AiVacancyFiltersEditor } from "./ai-vacancy-filters-editor";
import { AiVacancyManualConfirmSection } from "./ai-vacancy-manual-confirm";
import { AiVacancyPromptLanding } from "./ai-vacancy-prompt-landing";
import { AiVacancyPromptPane } from "./ai-vacancy-prompt-pane";
import { AiVacancyReviewEmpty } from "./ai-vacancy-review-empty";
import { AiVacancyReviewLoading } from "./ai-vacancy-review-loading";
import { AiVacancyRunsSidebar } from "./ai-vacancy-runs-sidebar";
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
  listAiVacancyRuns,
  VACANCY_AI_API_KEY,
} from "@/lib/api/vacancy-ai";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { aiDraftToCandidateParams, normalizeAiVacancyDraft } from "@/lib/vacancy-ai";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type {
  AiVacancyDraft,
  AiVacancyRunSummary,
} from "@workspace/shared/types/vacancy-ai";

function hasSelectedCompany(draft: AiVacancyDraft | null) {
  return draft?.companyId != null;
}

export function AiVacancyPage() {
  const router = useRouter();
  const session = useSession();
  const queryClient = useQueryClient();
  const { setOpen } = useSidebar();
  const [hasStarted, setHasStarted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [draft, setDraft] = useState<AiVacancyDraft | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedRunDocuments, setSelectedRunDocuments] = useState<
    { fileName: string }[]
  >([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [statusId, setStatusId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const hasDraft = draft !== null;

  const { data: runs = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: [VACANCY_AI_API_KEY, "runs"],
    queryFn: listAiVacancyRuns,
    retry: false,
  });

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

  useEffect(() => {
    if (!hasDraft || statusId.length > 0) {
      return;
    }

    const openStatus = statusesData?.items.find(
      (status) => status.name === "Abierta",
    );

    if (openStatus) {
      setStatusId(openStatus.id.toString());
    }
  }, [hasDraft, statusId.length, statusesData]);

  useEffect(() => {
    if (!hasDraft || assignedTo.length > 0) {
      return;
    }

    const sessionUserId = session.data?.userId;

    if (!sessionUserId) {
      return;
    }

    const currentUser = usersData?.items.find(
      (user) => user.id.toString() === sessionUserId,
    );

    if (currentUser) {
      setAssignedTo(currentUser.id.toString());
    }
  }, [assignedTo.length, hasDraft, session.data?.userId, usersData]);

  const extractMutation = useMutation({
    mutationFn: () =>
      extractVacancyWithAi({
        prompt: prompt.trim() || undefined,
        files,
      }),
    onSuccess: (response) => {
      const normalizedDraft = normalizeAiVacancyDraft(response.draft);

      setToken(response.token);
      setDraft(normalizedDraft);
      setSelectedCandidateIds([]);
      setStatusId("");
      setAssignedTo("");
      setFiles([]);
      void queryClient.invalidateQueries({ queryKey: [VACANCY_AI_API_KEY, "runs"] });
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
    if (prompt.trim().length === 0 && files.length === 0) {
      toast.error("Escribe un prompt o adjunta al menos un archivo.");
      return;
    }

    if (!hasStarted) {
      setOpen(false);
      setHasStarted(true);
    }

    extractMutation.mutate();
  }, [extractMutation, files.length, hasStarted, prompt, setOpen]);

  const handleSelectRun = useCallback((run: AiVacancyRunSummary) => {
    if (!run.draft) {
      toast.error("No hay borrador guardado para esta generación.");
      return;
    }

    setToken(run.publicToken);
    setDraft(normalizeAiVacancyDraft(run.draft));
    setPrompt(run.userPrompt ?? "");
    setFiles([]);
    setSelectedRunDocuments(run.documents);
    setSelectedCandidateIds([]);
    setStatusId("");
    setAssignedTo("");
    setHasStarted(true);
    setOpen(false);
    toast.success("Borrador cargado desde el historial.");
  }, [setOpen]);

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

  const historySidebar = (
    <AiVacancyRunsSidebar
      runs={runs}
      activeToken={token}
      isLoading={isLoadingRuns}
      onSelectRun={handleSelectRun}
      variant="sidebar"
    />
  );

  const mobileHistoryPanel = (
    <AiVacancyRunsSidebar
      runs={runs}
      activeToken={token}
      isLoading={isLoadingRuns}
      onSelectRun={handleSelectRun}
      variant="panel"
    />
  );

  const reviewPane = draft ? (
    <>
      <AiVacancyDraftFieldsSection draft={draft} onUpdate={updateDraft} />
      <AiVacancyFiltersEditor filters={draft.filters} onChange={handleFilterChange} />
      <AiVacancyCandidatesSection
        candidates={candidates?.items ?? []}
        totalItems={candidates?.meta.totalItems ?? 0}
        selectedCandidateIds={selectedCandidateIds}
        isLoading={isFetchingCandidates}
        onToggleSelection={toggleCandidateSelection}
      />
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
    </>
  ) : extractMutation.isPending ? (
    <AiVacancyReviewLoading />
  ) : (
    <AiVacancyReviewEmpty />
  );

  return (
    <AiVacancyShell>
      <AiVacancyPageLayout
        historySidebar={historySidebar}
        mobileHistory={mobileHistoryPanel}
      >
        {isWorkspace ? (
          <AiVacancyAgentLayout
            promptPane={
              <AiVacancyPromptPane
                prompt={prompt}
                files={files}
                onPromptChange={setPrompt}
                onFilesChange={setFiles}
                onSubmit={handlePromptSubmit}
                isGenerating={extractMutation.isPending}
                selectedRunDocuments={selectedRunDocuments}
              />
            }
            reviewPane={reviewPane}
          />
        ) : (
          <AiVacancyPromptLanding
            prompt={prompt}
            files={files}
            onPromptChange={setPrompt}
            onFilesChange={setFiles}
            onSubmit={handlePromptSubmit}
            isGenerating={extractMutation.isPending}
          />
        )}
      </AiVacancyPageLayout>
    </AiVacancyShell>
  );
}
