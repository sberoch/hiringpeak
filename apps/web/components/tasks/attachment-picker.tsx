"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, GitBranch, Search, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";

import {
  CANDIDATE_API_KEY,
  getAllCandidates,
} from "@/lib/api/candidate";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import type { TaskWithRelations } from "@workspace/shared/types/task";
import { cn } from "@workspace/ui/lib/utils";

export type AttachmentType = "candidate" | "vacancy" | "company";

export type AttachmentValue = {
  type: AttachmentType;
  id: number;
  label: string;
  sub?: string;
} | null;

const TYPE_LABEL: Record<AttachmentType, string> = {
  candidate: "Postulante",
  vacancy: "Vacante",
  company: "Empresa",
};

const TYPE_ICON: Record<AttachmentType, LucideIcon> = {
  candidate: User,
  vacancy: GitBranch,
  company: Building2,
};

const ATTACH_TYPES: AttachmentType[] = ["candidate", "vacancy", "company"];

export type AttachmentPayload = {
  candidateId: number | null;
  vacancyId: number | null;
  candidateVacancyId: number | null;
  companyId: number | null;
};

export function attachmentToPayload(
  value: AttachmentValue,
): AttachmentPayload {
  return {
    candidateId: value?.type === "candidate" ? value.id : null,
    vacancyId: value?.type === "vacancy" ? value.id : null,
    candidateVacancyId: null,
    companyId: value?.type === "company" ? value.id : null,
  };
}

export function taskToAttachment(task: TaskWithRelations): AttachmentValue {
  if (task.candidateId != null) {
    return {
      type: "candidate",
      id: task.candidateId,
      label: task.candidate?.name ?? `Postulante #${task.candidateId}`,
    };
  }
  if (task.vacancyId != null) {
    return {
      type: "vacancy",
      id: task.vacancyId,
      label: task.vacancy?.title ?? `Vacante #${task.vacancyId}`,
    };
  }
  if (task.companyId != null) {
    return {
      type: "company",
      id: task.companyId,
      label: task.company?.name ?? `Empresa #${task.companyId}`,
    };
  }
  return null;
}

interface AttachmentPickerProps {
  value: AttachmentValue;
  onChange: (next: AttachmentValue) => void;
}

export function AttachmentPicker({ value, onChange }: AttachmentPickerProps) {
  const [type, setType] = useState<AttachmentType | null>(value?.type ?? null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setType(value?.type ?? null);
  }, [value?.type]);

  if (value) {
    return (
      <SelectedPill
        value={value}
        onClear={() => {
          onChange(null);
          setQuery("");
          setType(null);
        }}
      />
    );
  }

  return (
    <div className="rounded-xl border border-brand-border bg-canvas p-3">
      <div className="flex flex-wrap gap-1.5">
        <TypeChip active={type === null} onClick={() => setType(null)}>
          Sin vínculo
        </TypeChip>
        {ATTACH_TYPES.map((t) => (
          <TypeChip key={t} active={type === t} onClick={() => setType(t)}>
            {TYPE_LABEL[t]}
          </TypeChip>
        ))}
      </div>
      {type && (
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-brand" />
            <input
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder={`Buscar ${TYPE_LABEL[type].toLowerCase()}…`}
              className="w-full rounded-md border border-brand-border bg-surface py-1.5 pl-8 pr-2 text-sm outline-none focus:border-electric"
            />
          </div>
          <ResultsList
            type={type}
            query={query}
            onPick={(picked) => {
              onChange(picked);
              setQuery("");
            }}
          />
        </div>
      )}
    </div>
  );
}

function TypeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
        active
          ? "bg-electric text-white"
          : "bg-surface text-ink hover:bg-brand-border-light",
      )}
    >
      {children}
    </button>
  );
}

function SelectedPill({
  value,
  onClear,
}: {
  value: NonNullable<AttachmentValue>;
  onClear: () => void;
}) {
  const Icon = TYPE_ICON[value.type];
  return (
    <div className="flex items-center justify-between rounded-md border border-electric/30 bg-electric/[0.06] px-3 py-2">
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
        <Icon className="h-4 w-4 shrink-0 text-electric" />
        <span className="truncate">{value.label}</span>
        <span className="shrink-0 text-xs font-normal text-slate-brand">
          · {TYPE_LABEL[value.type]}
        </span>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-md p-1 text-slate-brand hover:bg-white"
        aria-label="Quitar vínculo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ResultsList({
  type,
  query,
  onPick,
}: {
  type: AttachmentType;
  query: string;
  onPick: (picked: NonNullable<AttachmentValue>) => void;
}) {
  const { items, isLoading } = useAttachmentResults(type, query);

  return (
    <div className="mt-2 max-h-44 space-y-1 overflow-auto">
      {isLoading && (
        <p className="px-2 py-3 text-center text-xs text-muted-brand">
          Cargando…
        </p>
      )}
      {!isLoading && items.length === 0 && (
        <p className="px-2 py-3 text-center text-xs text-muted-brand">
          Sin resultados
        </p>
      )}
      {items.map((item) => (
        <button
          key={`${item.type}-${item.id}`}
          type="button"
          onClick={() => onPick(item)}
          className="flex w-full flex-col items-start rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-electric/[0.06]"
        >
          <span className="text-sm font-medium text-ink">{item.label}</span>
          {item.sub && (
            <span className="text-[11px] text-slate-brand">{item.sub}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function useAttachmentResults(type: AttachmentType, query: string) {
  const candidates = useQuery({
    queryKey: [CANDIDATE_API_KEY, "picker", query],
    queryFn: () =>
      getAllCandidates({ name: query || undefined, limit: 20, page: 1 }),
    enabled: type === "candidate",
    staleTime: 30_000,
  });
  const vacancies = useQuery({
    queryKey: [VACANCY_API_KEY, "picker", query],
    queryFn: () =>
      getAllVacancies({ title: query || undefined, limit: 20, page: 1 }),
    enabled: type === "vacancy",
    staleTime: 30_000,
  });
  const companies = useQuery({
    queryKey: [COMPANIES_API_KEY, "picker", query],
    queryFn: () =>
      getAllCompanies({ name: query || undefined, limit: 20, page: 1 }),
    enabled: type === "company",
    staleTime: 30_000,
  });

  if (type === "candidate") {
    return {
      items: (candidates.data?.items ?? []).map((c) => ({
        type: "candidate" as const,
        id: c.id,
        label: c.name,
        sub: c.shortDescription ?? undefined,
      })),
      isLoading: candidates.isLoading,
    };
  }
  if (type === "vacancy") {
    return {
      items: (vacancies.data?.items ?? []).map((v) => ({
        type: "vacancy" as const,
        id: v.id,
        label: v.title,
        sub: v.company?.name,
      })),
      isLoading: vacancies.isLoading,
    };
  }
  return {
    items: (companies.data?.items ?? []).map((c) => ({
      type: "company" as const,
      id: c.id,
      label: c.name,
      sub: undefined as string | undefined,
    })),
    isLoading: companies.isLoading,
  };
}
