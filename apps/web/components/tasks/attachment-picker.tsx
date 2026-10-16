"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { Check, Link2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { CANDIDATE_API_KEY, getAllCandidates } from "@/lib/api/candidate";
import {
  CANDIDATE_VACANCY_API_KEY,
  getCandidateVacancies,
} from "@/lib/api/candidate-vacancy";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { CONTACT_API_KEY, getContacts } from "@/lib/api/contact";
import { getOpportunities, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { getAllVacancies, VACANCY_API_KEY } from "@/lib/api/vacancy";
import { usePermissions } from "@/contexts/permission-context";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { Button } from "@workspace/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";

import {
  ATTACH_META,
  ATTACH_ORDER,
  AttachChip,
  attachmentKey,
  candidacyLabel,
  sameAttachment,
  sortAttachments,
  type Attachment,
} from "./attachments";

const RESULTS_PER_TYPE = 8;

interface AttachmentPickerProps {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
}

/**
 * Attaches a Task to any number of records: the picks show as removable
 * chips, and "Vincular a…" opens one command-palette search across every
 * attachable type. Picking a record toggles it. Opportunities and Contacts
 * are only offered to Users with commercial access.
 */
export function AttachmentPicker({ value, onChange }: AttachmentPickerProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const attachments = sortAttachments(value);

  const toggle = (a: Attachment) =>
    onChange(
      value.some((v) => sameAttachment(v, a))
        ? value.filter((v) => !sameAttachment(v, a))
        : [...value, a],
    );

  // "/" opens the palette (unless typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        e.key !== "/" ||
        el?.closest("input, textarea, [contenteditable=true]")
      )
        return;
      e.preventDefault();
      setPaletteOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div
        className="cursor-text rounded-xl border border-brand-border bg-canvas p-2.5"
        onClick={() => setPaletteOpen(true)}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {attachments.map((a) => (
            <AttachChip
              key={attachmentKey(a)}
              a={a}
              showType
              onRemove={() => toggle(a)}
              className="py-1 text-xs"
            />
          ))}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPaletteOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-electric hover:bg-electric/10"
          >
            {attachments.length === 0 ? (
              <Link2 className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {attachments.length === 0 ? "Vincular a…" : "Agregar"}
            <kbd className="ml-1 rounded border border-brand-border bg-surface px-1 text-[10px] font-medium text-muted-brand">
              /
            </kbd>
          </button>
        </div>
      </div>

      <CommandDialog
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        title="Vincular a…"
        description="Buscá cualquier registro"
        className="sm:max-w-lg"
        shouldFilter={false}
      >
        {paletteOpen && (
          <PaletteBody
            selected={value}
            onToggle={toggle}
            onDone={() => setPaletteOpen(false)}
          />
        )}
      </CommandDialog>
    </>
  );
}

function PaletteBody({
  selected,
  onToggle,
  onDone,
}: {
  selected: Attachment[];
  onToggle: (a: Attachment) => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query.trim(), 250);
  const { permissionCodes } = usePermissions();
  const commercial = hasCommercialAccess(permissionCodes);
  const { results, isLoading } = useAttachmentSearch(debounced, commercial);
  const hasResults = ATTACH_ORDER.some((t) => results[t].length > 0);

  return (
    <>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={
          commercial
            ? "Buscá oportunidades, contactos, empresas, vacantes…"
            : "Buscá empresas, vacantes, candidaturas, postulantes…"
        }
      />
      <CommandList className="max-h-[380px]">
        {!hasResults && (
          <CommandEmpty>
            {isLoading ? "Buscando…" : "Sin resultados."}
          </CommandEmpty>
        )}
        {ATTACH_ORDER.map((type) => {
          const items = results[type];
          if (items.length === 0) return null;
          const meta = ATTACH_META[type];
          const Icon = meta.icon;
          return (
            <CommandGroup key={type} heading={meta.plural}>
              {items.map((item) => {
                const isSelected = selected.some((s) =>
                  sameAttachment(s, item),
                );
                return (
                  <CommandItem
                    key={attachmentKey(item)}
                    value={attachmentKey(item)}
                    onSelect={() => onToggle(item)}
                    className="gap-2.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-electric/5 text-electric ring-1 ring-electric/10">
                      <Icon className="!h-3.5 !w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {item.label}
                      </span>
                      {item.sub && (
                        <span className="block truncate text-[11px] text-slate-brand">
                          {item.sub}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <Check className="!h-4 !w-4 text-electric" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          );
        })}
      </CommandList>
      <div className="flex items-center justify-between border-t px-3 py-2">
        <span className="text-xs text-muted-brand">
          {selected.length === 0
            ? "Elegí uno o varios"
            : `${selected.length} vinculados`}{" "}
          · Enter para agregar o quitar
        </span>
        <Button
          size="sm"
          className="bg-electric text-white hover:bg-electric-light"
          onClick={onDone}
        >
          Listo
        </Button>
      </div>
    </>
  );
}

/**
 * Searches every attachable type at once. Candidacies are found through the
 * matching Candidates (a Candidacy reads "Candidate en Vacancy").
 * Opportunities and Contacts are searched only with commercial access.
 */
function useAttachmentSearch(query: string, commercial: boolean) {
  const term = query || undefined;
  const page = { limit: RESULTS_PER_TYPE, page: 1 };

  const opportunities = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, "attach-picker", query],
    queryFn: () => getOpportunities({ search: term }),
    enabled: commercial,
    staleTime: 30_000,
  });
  const contacts = useQuery({
    queryKey: [CONTACT_API_KEY, "attach-picker", query],
    queryFn: () => getContacts({ search: term, ...page }),
    enabled: commercial,
    staleTime: 30_000,
  });

  const companies = useQuery({
    queryKey: [COMPANIES_API_KEY, "attach-picker", query],
    queryFn: () => getAllCompanies({ name: term, ...page }),
    staleTime: 30_000,
  });
  const vacancies = useQuery({
    queryKey: [VACANCY_API_KEY, "attach-picker", query],
    queryFn: () => getAllVacancies({ title: term, ...page }),
    staleTime: 30_000,
  });
  const candidates = useQuery({
    queryKey: [CANDIDATE_API_KEY, "attach-picker", query],
    queryFn: () => getAllCandidates({ name: term, ...page }),
    staleTime: 30_000,
  });
  const candidateIds = (candidates.data?.items ?? []).map((c) => c.id);
  const candidacies = useQuery({
    queryKey: [CANDIDATE_VACANCY_API_KEY, "attach-picker", candidateIds],
    queryFn: () => getCandidateVacancies({ candidateIds, ...page }),
    enabled: candidateIds.length > 0,
    staleTime: 30_000,
  });

  const results: Record<Attachment["type"], Attachment[]> = {
    opportunity: commercial
      ? (opportunities.data ?? []).slice(0, RESULTS_PER_TYPE).map((o) => ({
          type: "opportunity",
          id: o.id,
          label: o.title,
          sub: o.company?.name,
        }))
      : [],
    contact: commercial
      ? (contacts.data?.items ?? []).map((c) => ({
          type: "contact",
          id: c.id,
          label: c.name,
          sub: c.company?.name ?? undefined,
        }))
      : [],
    company: (companies.data?.items ?? []).map((c) => ({
      type: "company",
      id: c.id,
      label: c.name,
    })),
    vacancy: (vacancies.data?.items ?? []).map((v) => ({
      type: "vacancy",
      id: v.id,
      label: v.title,
      sub: v.company?.name,
    })),
    candidacy:
      candidateIds.length > 0
        ? (candidacies.data?.items ?? []).map((cv) => ({
            type: "candidacy",
            id: cv.id,
            label: candidacyLabel(cv.candidate.name, cv.vacancy.title),
            sub: cv.status?.name,
          }))
        : [],
    candidate: (candidates.data?.items ?? []).map((c) => ({
      type: "candidate",
      id: c.id,
      label: c.name,
      sub: c.shortDescription ?? undefined,
    })),
  };

  return {
    results,
    isLoading:
      companies.isLoading ||
      vacancies.isLoading ||
      candidates.isLoading ||
      (commercial && (opportunities.isLoading || contacts.isLoading)),
  };
}
