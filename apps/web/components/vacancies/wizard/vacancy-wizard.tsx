"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

import {
  createCandidateVacancy,
  deleteCandidateVacancy,
} from "@/lib/api/candidate-vacancy";
import {
  CANDIDATE_VACANCY_STATUS_API_KEY,
  getAllCandidateVacancyStatus,
} from "@/lib/api/candidate-vacancy-status";
import {
  createVacancy,
  getVacancyById,
  updateVacancy,
  VACANCY_API_KEY,
} from "@/lib/api/vacancy";
import type { Vacancy } from "@workspace/shared/types/vacancy";

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

export function VacancyWizard({ vacancyId }: VacancyWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const queryClient = useQueryClient();

  const duplicateFromParam = searchParams.get("duplicateFrom");
  const duplicateFromId =
    duplicateFromParam && /^\d+$/.test(duplicateFromParam)
      ? duplicateFromParam
      : null;

  const [currentStep, setCurrentStep] = useState<WizardStep>(
    parseStep(searchParams.get("step")),
  );
  const [savedVacancyId, setSavedVacancyId] = useState<number | undefined>(
    vacancyId,
  );
  const [pendingNav, setPendingNav] = useState<
    { kind: "back" } | { kind: "cancel" } | null
  >(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const initialSelectionRef = useRef<number[] | null>(null);
  const hasHydrated = useRef(false);
  const duplicateErrorHandledRef = useRef(false);

  const { data: savedVacancy } = useQuery({
    queryKey: [VACANCY_API_KEY, savedVacancyId],
    queryFn: () => getVacancyById(savedVacancyId!.toString()),
    enabled: savedVacancyId !== undefined,
    staleTime: 0,
  });

  const isDuplicateMode = duplicateFromId !== null && savedVacancyId === undefined;

  const { data: sourceVacancy, error: sourceVacancyError } = useQuery({
    queryKey: [VACANCY_API_KEY, "duplicate-source", duplicateFromId],
    queryFn: () => getVacancyById(duplicateFromId!),
    enabled: isDuplicateMode,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (!sourceVacancyError) return;
    if (duplicateErrorHandledRef.current) return;
    duplicateErrorHandledRef.current = true;
    toast.error("No se pudo cargar la vacante a duplicar.");
    router.replace("/vacancies/new");
  }, [sourceVacancyError, router]);

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

  // Hydrate form from saved vacancy on first load.
  useEffect(() => {
    if (!savedVacancy) return;
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    form.reset(vacancyToFormValues(savedVacancy));
  }, [savedVacancy, form]);

  // Hydrate form from source vacancy when duplicating.
  useEffect(() => {
    if (!isDuplicateMode) return;
    if (!sourceVacancy) return;
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    const seeded = vacancyToFormValues(sourceVacancy);
    seeded.title = `${seeded.title} (copia)`;
    // createdBy is an audit field: the user initiating the duplicate owns the new record.
    if (session.data?.userId) {
      seeded.createdBy = {
        id: parseInt(session.data.userId),
        name: session.data.user?.name ?? "",
      };
    } else {
      seeded.createdBy = undefined as unknown as VacancyWizardFormSchema["createdBy"];
    }
    form.reset(seeded);
  }, [isDuplicateMode, sourceVacancy, form, session.data?.userId, session.data?.user?.name]);

  // Default createdBy/assignedTo from session in pure-create mode.
  useEffect(() => {
    if (savedVacancyId !== undefined) return;
    if (!session.data?.userId) return;
    const userId = parseInt(session.data.userId);
    const placeholder = {
      id: userId,
      name: session.data.user?.name ?? "",
    };
    if (!form.getValues("createdBy")) {
      form.setValue("createdBy", placeholder, { shouldDirty: false });
    }
    if (!form.getValues("assignedTo")) {
      form.setValue("assignedTo", placeholder, { shouldDirty: false });
    }
  }, [session.status, session.data?.userId, savedVacancyId, form]);

  // Sync URL → step state.
  useEffect(() => {
    setCurrentStep(parseStep(searchParams.get("step")));
  }, [searchParams]);

  // Guard: step 3 requires saved vacancy.
  useEffect(() => {
    if (currentStep === 3 && savedVacancyId === undefined) {
      const url = duplicateFromId
        ? `/vacancies/new?step=1&duplicateFrom=${duplicateFromId}`
        : "/vacancies/new?step=1";
      router.replace(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, savedVacancyId, duplicateFromId]);

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

  // Mutations.
  const { mutateAsync: doCreate, isPending: isCreating } = useMutation({
    mutationFn: (values: VacancyWizardFormSchema) =>
      createVacancy(wizardFormToCreate(values)),
    onSuccess: (vacancy) => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      hasHydrated.current = true;
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

  const isPersisting = isCreating || isUpdating || isSavingCandidates;

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
      // Discard step 2 filter edits only.
      if (savedVacancy) {
        form.setValue("filters", vacancyToFormValues(savedVacancy).filters, {
          shouldDirty: false,
        });
      } else {
        form.setValue("filters", EMPTY_FILTERS, { shouldDirty: false });
      }
    } else if (action.kind === "cancel") {
      // Cancel: full reset.
      if (savedVacancy) {
        form.reset(vacancyToFormValues(savedVacancy));
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
  }, [
    currentStep,
    selectedCandidates,
    form.formState.isDirty,
  ]);

  function handleStep3Initialized(next: number[]) {
    initialSelectionRef.current = [...next];
  }

  const isCreateMode = savedVacancyId === undefined;
  const heading = isDuplicateMode
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

  const canRenderStep3 = savedVacancy !== undefined;
  const isDuplicateSourceLoading = isDuplicateMode && !sourceVacancy;

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
            {isDuplicateSourceLoading ? (
              <div className="h-64 animate-pulse bg-brand-border-light rounded-xl" />
            ) : (
              <>
                {currentStep === 1 && <StepBasicInfo form={form} />}
                {currentStep === 2 && <StepSearchBrief form={form} />}
                {currentStep === 3 &&
                  (canRenderStep3 ? (
                    <StepCandidateSelection
                      vacancy={savedVacancy!}
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
              disabled={isPersisting || isDuplicateSourceLoading}
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
