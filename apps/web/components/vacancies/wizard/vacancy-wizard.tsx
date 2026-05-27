"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { PageHeading } from "@workspace/ui/components/page-heading";

import { AiVacancyPromptLanding } from "@/components/vacancies/ai-vacancy/ai-vacancy-prompt-landing";
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import {
  createCandidateVacancy,
  deleteCandidateVacancy,
} from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getAllCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import {
  createVacancyWithAi,
  extractVacancyWithAi,
  getAiVacancyRun,
  VACANCY_AI_API_KEY,
} from "@/lib/api/vacancy-ai";
import {
  createVacancy,
  getVacancyById,
  updateVacancy,
  VACANCY_API_KEY,
} from "@/lib/api/vacancy";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { AiVacancyDraft } from "@workspace/shared/types/vacancy-ai";
import type {
  Vacancy,
  VacancyFiltersType,
} from "@workspace/shared/types/vacancy";

import { StepBasicInfo } from "./step-basic-info";
import { StepCandidateSelection } from "./step-candidate-selection";
import { StepSearchBrief } from "./step-search-brief";
import {
  STEP_FIELDS,
  vacancyWizardFormSchema,
  type VacancyWizardFormSchema,
  wizardFormToCreate,
  wizardFormToUpdate,
} from "./vacancy-wizard.schema";
import { WizardStepIndicator, type WizardStep } from "./wizard-step-indicator";

interface VacancyWizardProps {
  vacancyId?: number;
}

function parseStep(s: string | null): WizardStep {
  const n = Number(s);
  if (n === 1 || n === 2 || n === 3) return n;
  return 1;
}

const EMPTY_FILTERS: VacancyWizardFormSchema["filters"] = {
  seniorities: [],
  areas: [],
  industries: [],
  countries: [],
  provinces: [],
  languages: [],
  minStars: null,
  minAge: null,
  maxAge: null,
  gender: "none",
};

const EMPTY_DEFAULTS = {
  title: "",
  description: "",
  salary: "",
  filters: EMPTY_FILTERS,
} as unknown as VacancyWizardFormSchema;

function vacancyToFormValues(vacancy: Vacancy): VacancyWizardFormSchema {
  return {
    title: vacancy.title,
    description: vacancy.description ?? "",
    salary: vacancy.salary ?? "",
    status: vacancy.status,
    company: vacancy.company,
    createdBy: vacancy.createdBy,
    assignedTo: vacancy.assignedTo,
    filters: {
      seniorities: vacancy.filters?.seniorities ?? [],
      areas: vacancy.filters?.areas ?? [],
      industries: vacancy.filters?.industries ?? [],
      minStars: vacancy.filters?.minStars ?? null,
      gender: vacancy.filters?.gender ?? "none",
      minAge: vacancy.filters?.minAge ?? null,
      maxAge: vacancy.filters?.maxAge ?? null,
      countries: vacancy.filters?.countries ?? [],
      provinces: vacancy.filters?.provinces ?? [],
      languages: vacancy.filters?.languages ?? [],
    },
  };
}

type WizardFilters = NonNullable<VacancyWizardFormSchema["filters"]>;
type WizardCompany = NonNullable<VacancyWizardFormSchema["company"]>;
type WizardStatus = NonNullable<VacancyWizardFormSchema["status"]>;
type WizardUser = NonNullable<VacancyWizardFormSchema["assignedTo"]>;

type AiHydrationCatalogs = {
  companies: WizardCompany[];
  statuses: WizardStatus[];
  users: WizardUser[];
  seniorities: NonNullable<WizardFilters["seniorities"]>;
  areas: NonNullable<WizardFilters["areas"]>;
  industries: NonNullable<WizardFilters["industries"]>;
};

function getSessionUserValue(
  userId: string | undefined,
  userName: string | null | undefined,
): WizardUser | undefined {
  if (!userId) {
    return undefined;
  }

  return {
    id: Number.parseInt(userId, 10),
    name: userName ?? "",
  };
}

function mapIdsToCatalogItems<T extends { id: number }>(
  ids: number[] | undefined,
  items: T[],
) {
  if (!ids?.length) {
    return [];
  }

  return ids
    .map((id) => items.find((item) => item.id === id) ?? null)
    .filter((item): item is T => item !== null);
}

function aiDraftToFormValues(
  draft: AiVacancyDraft,
  catalogs: AiHydrationCatalogs,
  sessionUser: WizardUser | undefined,
): VacancyWizardFormSchema {
  return {
    title: draft.title ?? "",
    description: draft.description ?? "",
    salary: draft.salary ?? "",
    status: undefined as unknown as VacancyWizardFormSchema["status"],
    company:
      catalogs.companies.find((company) => company.id === draft.companyId) ??
      (undefined as unknown as VacancyWizardFormSchema["company"]),
    createdBy:
      sessionUser ??
      (undefined as unknown as VacancyWizardFormSchema["createdBy"]),
    assignedTo:
      sessionUser ??
      (undefined as unknown as VacancyWizardFormSchema["assignedTo"]),
    filters: {
      seniorities: mapIdsToCatalogItems(
        draft.filters.seniorityIds,
        catalogs.seniorities,
      ),
      areas: mapIdsToCatalogItems(draft.filters.areaIds, catalogs.areas),
      industries: mapIdsToCatalogItems(
        draft.filters.industryIds,
        catalogs.industries,
      ),
      minStars: draft.filters.minStars ?? null,
      gender: draft.filters.gender ?? "none",
      minAge: draft.filters.minAge ?? null,
      maxAge: draft.filters.maxAge ?? null,
      countries: draft.filters.countries ?? [],
      provinces: draft.filters.provinces ?? [],
      languages: draft.filters.languages ?? [],
    },
  };
}

function wizardFiltersToVacancyFilters(
  filters: VacancyWizardFormSchema["filters"] | undefined,
): VacancyFiltersType {
  return {
    seniorities: filters?.seniorities ?? [],
    areas: filters?.areas ?? [],
    industries: filters?.industries ?? [],
    minStars: filters?.minStars ?? undefined,
    gender: filters?.gender ?? "none",
    minAge: filters?.minAge ?? undefined,
    maxAge: filters?.maxAge ?? undefined,
    countries: filters?.countries ?? [],
    provinces: filters?.provinces ?? [],
    languages: filters?.languages ?? [],
  };
}

function wizardFormToAiDraft(form: VacancyWizardFormSchema): AiVacancyDraft {
  return {
    title: form.title,
    description: form.description || undefined,
    salary: form.salary || null,
    companyId: form.company.id,
    filters: {
      seniorityIds: form.filters?.seniorities?.map((item) => item.id) ?? [],
      areaIds: form.filters?.areas?.map((item) => item.id) ?? [],
      industryIds: form.filters?.industries?.map((item) => item.id) ?? [],
      minStars: form.filters?.minStars ?? undefined,
      gender:
        form.filters?.gender && form.filters.gender !== "none"
          ? form.filters.gender
          : undefined,
      minAge: form.filters?.minAge ?? undefined,
      maxAge: form.filters?.maxAge ?? undefined,
      countries: form.filters?.countries,
      provinces: form.filters?.provinces,
      languages: form.filters?.languages,
    },
  };
}

export function VacancyWizard({ vacancyId }: VacancyWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const queryClient = useQueryClient();

  const sourceParam = searchParams.get("source");
  const duplicateFromParam = searchParams.get("duplicateFrom");
  const duplicateFromId =
    duplicateFromParam && /^\d+$/.test(duplicateFromParam)
      ? duplicateFromParam
      : null;
  const aiTokenParam = searchParams.get("aiToken");
  const aiToken =
    aiTokenParam && aiTokenParam.trim().length > 0 ? aiTokenParam : null;
  const isAiMode = vacancyId === undefined && sourceParam === "ai";
  const isAiPromptMode = isAiMode && aiToken === null;

  const [currentStep, setCurrentStep] = useState<WizardStep>(
    parseStep(searchParams.get("step")),
  );
  const [savedVacancyId, setSavedVacancyId] = useState<number | undefined>(
    vacancyId,
  );
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pendingNav, setPendingNav] = useState<
    { kind: "back" } | { kind: "cancel" } | null
  >(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const initialSelectionRef = useRef<number[] | null>(null);
  const hydratedSourceRef = useRef<string | null>(null);
  const duplicateErrorHandledRef = useRef(false);
  const aiRunErrorHandledRef = useRef(false);
  const sessionUserValue = useMemo(
    () => getSessionUserValue(session.data?.userId, session.data?.user?.name),
    [session.data?.user?.name, session.data?.userId],
  );

  const { data: savedVacancy } = useQuery({
    queryKey: [VACANCY_API_KEY, savedVacancyId],
    queryFn: () => getVacancyById(savedVacancyId!.toString()),
    enabled: savedVacancyId !== undefined,
    staleTime: 0,
  });

  const isDuplicateMode =
    duplicateFromId !== null && savedVacancyId === undefined;
  const isAiSeededMode =
    isAiMode && aiToken !== null && savedVacancyId === undefined;

  const { data: sourceVacancy, error: sourceVacancyError } = useQuery({
    queryKey: [VACANCY_API_KEY, "duplicate-source", duplicateFromId],
    queryFn: () => getVacancyById(duplicateFromId!),
    enabled: isDuplicateMode,
    retry: false,
    staleTime: 0,
  });

  const { data: aiRun, error: aiRunError } = useQuery({
    queryKey: [VACANCY_AI_API_KEY, "run", aiToken],
    queryFn: () => getAiVacancyRun(aiToken!),
    enabled: isAiSeededMode,
    retry: false,
    staleTime: 0,
  });

  const { data: aiCompanies } = useQuery({
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
    enabled: isAiSeededMode,
  });

  const { data: aiUsers } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
    enabled: isAiSeededMode,
  });

  const { data: aiStatuses } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1e9, page: 1 }),
    enabled: isAiSeededMode,
  });

  const { data: aiSeniorities } = useQuery({
    queryKey: [SENIORITY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllSeniorities({ limit: 1e9, page: 1 }),
    enabled: isAiSeededMode,
  });

  const { data: aiAreas } = useQuery({
    queryKey: [AREAS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllAreas({ limit: 1e9, page: 1 }),
    enabled: isAiSeededMode,
  });

  const { data: aiIndustries } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllIndustries({ limit: 1e9, page: 1 }),
    enabled: isAiSeededMode,
  });

  const aiHydrationCatalogs = useMemo<AiHydrationCatalogs | null>(() => {
    if (
      !aiCompanies ||
      !aiUsers ||
      !aiStatuses ||
      !aiSeniorities ||
      !aiAreas ||
      !aiIndustries
    ) {
      return null;
    }

    return {
      companies: aiCompanies.items,
      users: aiUsers.items,
      statuses: aiStatuses.items,
      seniorities: aiSeniorities.items,
      areas: aiAreas.items,
      industries: aiIndustries.items,
    };
  }, [aiAreas, aiCompanies, aiIndustries, aiSeniorities, aiStatuses, aiUsers]);

  const duplicateSeededValues = useMemo(() => {
    if (!sourceVacancy) {
      return null;
    }

    const seeded = vacancyToFormValues(sourceVacancy);
    seeded.title = `${seeded.title} (copia)`;
    seeded.createdBy =
      sessionUserValue ??
      (undefined as unknown as VacancyWizardFormSchema["createdBy"]);
    return seeded;
  }, [sessionUserValue, sourceVacancy]);

  const aiSeededValues = useMemo(() => {
    if (!aiRun?.draft || !aiHydrationCatalogs) {
      return null;
    }

    return aiDraftToFormValues(
      aiRun.draft,
      aiHydrationCatalogs,
      sessionUserValue,
    );
  }, [aiHydrationCatalogs, aiRun?.draft, sessionUserValue]);

  useEffect(() => {
    if (!sourceVacancyError) return;
    if (duplicateErrorHandledRef.current) return;
    duplicateErrorHandledRef.current = true;
    toast.error("No se pudo cargar la vacante a duplicar.");
    router.replace("/vacancies/new");
  }, [sourceVacancyError, router]);

  useEffect(() => {
    if (!aiRunError) return;
    if (aiRunErrorHandledRef.current) return;
    aiRunErrorHandledRef.current = true;
    toast.error("No se pudo cargar el borrador generado con IA.");
    router.replace("/vacancies/new?source=ai");
  }, [aiRunError, router]);

  const { data: cvStatuses } = useQuery({
    queryKey: [
      CANDIDATE_VACANCY_STATUS_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getAllCandidateVacancyStatus({
        order: "sort:asc",
        limit: 1e9,
        page: 1,
      }),
  });

  const form = useForm<VacancyWizardFormSchema>({
    resolver: zodResolver(vacancyWizardFormSchema),
    defaultValues: EMPTY_DEFAULTS,
    mode: "onTouched",
  });

  useEffect(() => {
    if (!savedVacancy) return;
    const hydrationKey = `saved:${savedVacancy.id}`;
    if (hydratedSourceRef.current === hydrationKey) return;
    hydratedSourceRef.current = hydrationKey;
    form.reset(vacancyToFormValues(savedVacancy));
  }, [savedVacancy, form]);

  useEffect(() => {
    if (!isDuplicateMode || !duplicateSeededValues || !duplicateFromId) return;
    const hydrationKey = `duplicate:${duplicateFromId}`;
    if (hydratedSourceRef.current === hydrationKey) return;
    hydratedSourceRef.current = hydrationKey;
    form.reset(duplicateSeededValues);
  }, [duplicateFromId, duplicateSeededValues, form, isDuplicateMode]);

  useEffect(() => {
    if (!isAiSeededMode || !aiSeededValues || !aiToken) return;
    const hydrationKey = `ai:${aiToken}`;
    if (hydratedSourceRef.current === hydrationKey) return;
    hydratedSourceRef.current = hydrationKey;
    form.reset(aiSeededValues);
  }, [aiSeededValues, aiToken, form, isAiSeededMode]);

  useEffect(() => {
    if (savedVacancyId !== undefined) return;
    if (!sessionUserValue) return;
    if (!form.getValues("createdBy")) {
      form.setValue("createdBy", sessionUserValue, { shouldDirty: false });
    }
    if (!form.getValues("assignedTo")) {
      form.setValue("assignedTo", sessionUserValue, { shouldDirty: false });
    }
  }, [form, savedVacancyId, sessionUserValue]);

  useEffect(() => {
    setCurrentStep(parseStep(searchParams.get("step")));
  }, [searchParams]);

  useEffect(() => {
    if (currentStep === 3 && savedVacancyId === undefined && !isAiSeededMode) {
      const url = duplicateFromId
        ? `/vacancies/new?step=1&duplicateFrom=${duplicateFromId}`
        : isAiMode
          ? "/vacancies/new?source=ai&step=1"
          : "/vacancies/new?step=1";
      router.replace(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, duplicateFromId, isAiMode, isAiSeededMode, savedVacancyId]);

  function navigateToStep(
    step: WizardStep,
    opts: { idOverride?: number } = {},
  ) {
    const id = opts.idOverride ?? savedVacancyId;
    let url: string;
    if (id !== undefined) {
      url = `/vacancies/${id}/edit?step=${step}`;
    } else if (duplicateFromId) {
      url = `/vacancies/new?step=${step}&duplicateFrom=${duplicateFromId}`;
    } else if (isAiMode) {
      const params = new URLSearchParams({
        source: "ai",
        step: step.toString(),
      });
      if (aiToken) {
        params.set("aiToken", aiToken);
      }
      url = `/vacancies/new?${params.toString()}`;
    } else {
      url = `/vacancies/new?step=${step}`;
    }
    router.replace(url);
    setCurrentStep(step);
  }

  // Per-step dirty tracking.
  function isCurrentStepDirty(): boolean {
    if (currentStep === 3) {
      if (initialSelectionRef.current === null) return false;
      const initial = initialSelectionRef.current;
      if (initial.length !== selectedCandidates.length) return true;
      return selectedCandidates.some((id) => !initial.includes(id));
    }
    const dirty = form.formState.dirtyFields;
    if (currentStep === 1) {
      return STEP_FIELDS.basicInfo.some(
        (f) => !!dirty[f as keyof typeof dirty],
      );
    }
    // Step 2: filters is a nested object — check if any sub-field is dirty.
    const filtersDirty = dirty.filters;
    if (!filtersDirty) return false;
    if (typeof filtersDirty !== "object") return !!filtersDirty;
    return Object.values(filtersDirty).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v,
    );
  }

  const { mutate: runAiExtraction, isPending: isExtractingWithAi } =
    useMutation({
      mutationFn: () =>
        extractVacancyWithAi({
          prompt: prompt.trim() || undefined,
          files,
        }),
      onSuccess: ({ token }) => {
        setFiles([]);
        void queryClient.invalidateQueries({ queryKey: [VACANCY_AI_API_KEY] });
        toast.success("Borrador generado. Revísalo antes de crear la vacante.");
        router.replace(`/vacancies/new?source=ai&aiToken=${token}&step=1`);
      },
      onError: () => {
        toast.error("No se pudo generar el borrador.");
      },
    });

  const { mutateAsync: doCreate, isPending: isCreating } = useMutation({
    mutationFn: (values: VacancyWizardFormSchema) =>
      createVacancy(wizardFormToCreate(values)),
    onSuccess: (vacancy) => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      hydratedSourceRef.current = `saved:${vacancy.id}`;
      setSavedVacancyId(vacancy.id);
    },
  });

  const { mutateAsync: doUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (values: VacancyWizardFormSchema) =>
      updateVacancy(savedVacancyId!.toString(), wizardFormToUpdate(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
    },
  });

  const { mutateAsync: doSaveCandidates, isPending: isSavingCandidates } =
    useMutation({
      mutationFn: async () => {
        if (!savedVacancy) throw new Error("Vacancy is required");
        const initialSelection = initialSelectionRef.current ?? [];
        const addIds = selectedCandidates.filter(
          (id) => !initialSelection.includes(id),
        );
        const removeIds = initialSelection.filter(
          (id) => !selectedCandidates.includes(id),
        );
        const cvIdsToDelete = savedVacancy.candidates
          .filter((cv) => removeIds.includes(cv.candidate.id))
          .map((cv) => cv.id.toString());
        const initialStatus = cvStatuses?.items.find((s) => s.isInitial);
        if (!initialStatus) {
          throw new Error("No hay un estado inicial configurado");
        }
        await Promise.all([
          ...cvIdsToDelete.map(deleteCandidateVacancy),
          ...addIds.map((candidateId) =>
            createCandidateVacancy({
              candidateId,
              vacancyId: savedVacancy.id,
              candidateVacancyStatusId: initialStatus.id,
              notes: "",
            }),
          ),
        ]);
      },
    });

  const { mutateAsync: doCreateWithAi, isPending: isCreatingWithAi } =
    useMutation({
      mutationFn: (values: VacancyWizardFormSchema) => {
        if (!aiToken) {
          throw new Error("No se encontró el token de la generación.");
        }

        return createVacancyWithAi({
          token: aiToken,
          draft: wizardFormToAiDraft(values),
          companyId: values.company.id,
          statusId: values.status.id,
          assignedTo: values.assignedTo.id,
          selectedCandidateIds: selectedCandidates,
        });
      },
      onSuccess: (vacancy) => {
        void queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
        void queryClient.invalidateQueries({ queryKey: [VACANCY_AI_API_KEY] });
        toast.success("Vacante creada correctamente");
        router.push(`/vacancies/${vacancy.id}`);
      },
    });

  const isPersisting =
    isCreating ||
    isUpdating ||
    isSavingCandidates ||
    isExtractingWithAi ||
    isCreatingWithAi;

  function handlePromptSubmit() {
    if (prompt.trim().length === 0 && files.length === 0) {
      toast.error("Escribí un prompt o adjuntá al menos un archivo.");
      return;
    }

    runAiExtraction();
  }

  async function handleNext() {
    if (currentStep === 1) {
      const ok = await form.trigger(
        STEP_FIELDS.basicInfo as unknown as readonly (keyof VacancyWizardFormSchema)[],
      );
      if (!ok) {
        toast.error("Revisá los campos marcados en rojo para continuar.");
        return;
      }
      if (savedVacancyId !== undefined) {
        try {
          await doUpdate(form.getValues());
          form.reset(form.getValues());
        } catch {
          toast.error("No se pudo guardar la vacante.");
          return;
        }
      }
      navigateToStep(2);
    } else if (currentStep === 2) {
      const ok = await form.trigger(["filters"]);
      if (!ok) {
        toast.error("Revisá los campos marcados en rojo para continuar.");
        return;
      }
      const values = form.getValues();
      if (isAiSeededMode) {
        form.reset(values);
        initialSelectionRef.current = null;
        navigateToStep(3);
        return;
      }
      if (savedVacancyId === undefined) {
        try {
          const created = await doCreate(values);
          form.reset(values);
          navigateToStep(3, { idOverride: created.id });
        } catch {
          toast.error("No se pudo crear la vacante.");
        }
      } else {
        try {
          await doUpdate(values);
          form.reset(values);
          navigateToStep(3);
        } catch {
          toast.error("No se pudo guardar la vacante.");
        }
      }
    } else if (currentStep === 3) {
      if (isAiSeededMode) {
        if (selectedCandidates.length === 0) {
          toast.error("Seleccioná al menos un postulante para continuar.");
          return;
        }

        try {
          await doCreateWithAi(form.getValues());
        } catch (e) {
          const message =
            e instanceof Error
              ? e.message
              : "No se pudo crear la vacante con IA.";
          toast.error(message);
        }
        return;
      }

      try {
        await doSaveCandidates();
        await queryClient.invalidateQueries({
          queryKey: [VACANCY_API_KEY, savedVacancyId],
        });
        toast.success("Vacante guardada correctamente");
        if (savedVacancyId !== undefined) {
          router.push(`/vacancies/${savedVacancyId}`);
        }
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "No se pudieron guardar los postulantes.";
        toast.error(message);
      }
    }
  }

  function handleBackClick() {
    if (currentStep === 1) return;
    if (isCurrentStepDirty()) {
      setPendingNav({ kind: "back" });
    } else {
      doBack();
    }
  }

  function doBack() {
    if (currentStep === 2) navigateToStep(1);
    else if (currentStep === 3) navigateToStep(2);
  }

  function handleCancelClick() {
    if (isCurrentStepDirty()) {
      setPendingNav({ kind: "cancel" });
    } else {
      doCancel();
    }
  }

  function doCancel() {
    if (savedVacancyId !== undefined) {
      router.push(`/vacancies/${savedVacancyId}`);
    } else if (isAiMode) {
      router.push("/vacancies");
    } else if (duplicateFromId) {
      router.back();
    } else {
      router.push("/vacancies");
    }
  }

  function confirmPendingNav() {
    if (!pendingNav) return;
    const action = pendingNav;
    setPendingNav(null);

    if (currentStep === 3) {
      if (initialSelectionRef.current) {
        setSelectedCandidates([...initialSelectionRef.current]);
      }
    } else if (action.kind === "back" && currentStep === 2) {
      if (savedVacancy) {
        form.setValue("filters", vacancyToFormValues(savedVacancy).filters, {
          shouldDirty: false,
        });
      } else if (duplicateSeededValues) {
        form.setValue("filters", duplicateSeededValues.filters, {
          shouldDirty: false,
        });
      } else if (aiSeededValues) {
        form.setValue("filters", aiSeededValues.filters, {
          shouldDirty: false,
        });
      } else {
        form.setValue("filters", EMPTY_FILTERS, { shouldDirty: false });
      }
    } else if (action.kind === "cancel") {
      if (savedVacancy) {
        form.reset(vacancyToFormValues(savedVacancy));
      } else if (duplicateSeededValues) {
        form.reset(duplicateSeededValues);
      } else if (aiSeededValues) {
        form.reset(aiSeededValues);
      } else {
        form.reset(EMPTY_DEFAULTS);
      }
    }

    if (action.kind === "back") doBack();
    else doCancel();
  }

  // beforeunload warning when current step is dirty.
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!isCurrentStepDirty()) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedCandidates, form.formState.isDirty]);

  function handleStep3Initialized(next: number[]) {
    initialSelectionRef.current = [...next];
  }

  const watchedFilters = form.watch("filters");
  const isCreateMode = savedVacancyId === undefined;
  const heading = isAiPromptMode
    ? {
        title: "Nueva vacante con IA",
        description:
          "Describí el rol o adjuntá documentos para generar un borrador inicial.",
      }
    : isAiSeededMode
      ? {
          title: "Nueva vacante con IA",
          description:
            "Revisá y ajustá el borrador generado en tres pasos antes de crear la vacante.",
        }
      : isDuplicateMode
        ? {
            title: "Duplicar vacante",
            description: sourceVacancy
              ? `Duplicando "${sourceVacancy.title}". Ajustá los datos y continuá.`
              : "Cargando vacante origen...",
          }
        : isCreateMode
          ? {
              title: "Nueva vacante",
              description:
                "Completá la información en tres pasos para sumar la vacante.",
            }
          : {
              title: "Editar vacante",
              description:
                "Modificá la información, el perfil buscado o los postulantes seleccionados.",
            };

  const primaryLabel = (() => {
    if (currentStep < 3) {
      return isPersisting ? "Guardando..." : "Siguiente";
    }
    if (isCreateMode) {
      return isPersisting ? "Guardando..." : "Finalizar";
    }
    return isPersisting ? "Guardando..." : "Guardar cambios";
  })();

  const canRenderStep3 = savedVacancy !== undefined || isAiSeededMode;
  const isDuplicateSourceLoading = isDuplicateMode && !sourceVacancy;
  const isAiHydrationLoading = isAiSeededMode && aiSeededValues === null;
  const isStepContentLoading = isDuplicateSourceLoading || isAiHydrationLoading;
  const candidateSelectionFilters =
    savedVacancy?.filters ?? wizardFiltersToVacancyFilters(watchedFilters);
  const existingCandidateIds =
    savedVacancy?.candidates.map(
      (candidateVacancy) => candidateVacancy.candidate.id,
    ) ?? [];

  if (isAiPromptMode) {
    return (
      <div className="mb-12 flex flex-col gap-8">
        <div className="flex items-start justify-between gap-4">
          <PageHeading
            icon={Briefcase}
            title={heading.title}
            description={heading.description}
          />
          <Button
            type="button"
            variant="brand-ghost"
            className="h-10 shrink-0 bg-white px-4"
            onClick={handleCancelClick}
            disabled={isPersisting}
          >
            Cancelar
          </Button>
        </div>

        <div className="rounded-2xl border border-brand-border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <AiVacancyPromptLanding
            prompt={prompt}
            files={files}
            onPromptChange={setPrompt}
            onFilesChange={setFiles}
            onSubmit={handlePromptSubmit}
            isGenerating={isExtractingWithAi}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 mb-12">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          icon={Briefcase}
          title={heading.title}
          description={heading.description}
        />
        <Button
          type="button"
          variant="brand-ghost"
          className="bg-white shrink-0 h-10 px-4"
          onClick={handleCancelClick}
          disabled={isPersisting}
        >
          Cancelar
        </Button>
      </div>

      <WizardStepIndicator currentStep={currentStep} />

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
        >
          <div className="rounded-2xl border border-brand-border bg-surface p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {isStepContentLoading ? (
              <div className="h-64 animate-pulse bg-brand-border-light rounded-xl" />
            ) : (
              <>
                {currentStep === 1 && (
                  <StepBasicInfo
                    form={form}
                    createdByDisabled={isAiSeededMode}
                  />
                )}
                {currentStep === 2 && <StepSearchBrief form={form} />}
                {currentStep === 3 &&
                  (canRenderStep3 ? (
                    <StepCandidateSelection
                      vacancyFilters={candidateSelectionFilters}
                      existingCandidateIds={existingCandidateIds}
                      selectionKey={
                        savedVacancy
                          ? `saved:${savedVacancy.id}`
                          : `ai:${aiToken ?? "draft"}`
                      }
                      selectedCandidates={selectedCandidates}
                      onChangeSelected={setSelectedCandidates}
                      onInitialized={handleStep3Initialized}
                    />
                  ) : (
                    <div className="h-64 animate-pulse bg-brand-border-light rounded-xl" />
                  ))}
              </>
            )}
          </div>

          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="brand-outline"
                className="h-10 px-5"
                onClick={handleBackClick}
                disabled={isPersisting}
              >
                ← Atrás
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="submit"
              variant="brand"
              className="h-10 px-6"
              disabled={isPersisting || isStepContentLoading}
            >
              {primaryLabel}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog
        open={pendingNav !== null}
        onOpenChange={(open) => {
          if (!open) setPendingNav(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Tenés cambios sin guardar en este paso. Si continuás, se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver al paso</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingNav}>
              Descartar y continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
