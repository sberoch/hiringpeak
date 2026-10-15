"use client";

import {
  Building2,
  GitBranch,
  Slash,
  User,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import type {
  TaskAttachmentIds,
  TaskWithRelations,
} from "@workspace/shared/types/task";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

/** A record a Task is attached to (ADR 0005: any number, any mix of types). */
export type AttachmentType = "company" | "vacancy" | "candidacy" | "candidate";

export type Attachment = {
  type: AttachmentType;
  id: number;
  label: string;
  sub?: string;
};

export const ATTACH_META: Record<
  AttachmentType,
  { label: string; plural: string; icon: LucideIcon }
> = {
  company: { label: "Empresa", plural: "Empresas", icon: Building2 },
  vacancy: { label: "Vacante", plural: "Vacantes", icon: GitBranch },
  candidacy: {
    label: "Candidatura",
    plural: "Candidaturas",
    icon: UserCheck,
  },
  candidate: { label: "Postulante", plural: "Postulantes", icon: User },
};

/** Display order: relationship first, then recruiting. */
export const ATTACH_ORDER: AttachmentType[] = [
  "company",
  "vacancy",
  "candidacy",
  "candidate",
];

export function attachmentKey(a: Pick<Attachment, "type" | "id">) {
  return `${a.type}-${a.id}`;
}

export function sameAttachment(
  a: Pick<Attachment, "type" | "id">,
  b: Pick<Attachment, "type" | "id">,
) {
  return a.type === b.type && a.id === b.id;
}

export function sortAttachments(list: Attachment[]): Attachment[] {
  return [...list].sort(
    (a, b) => ATTACH_ORDER.indexOf(a.type) - ATTACH_ORDER.indexOf(b.type),
  );
}

export function candidacyLabel(candidateName: string, vacancyTitle: string) {
  return `${candidateName} en ${vacancyTitle}`;
}

export function taskAttachments(task: TaskWithRelations): Attachment[] {
  return sortAttachments([
    ...(task.companies ?? []).map((c) => ({
      type: "company" as const,
      id: c.id,
      label: c.name,
    })),
    ...(task.vacancies ?? []).map((v) => ({
      type: "vacancy" as const,
      id: v.id,
      label: v.title,
    })),
    ...(task.candidacies ?? []).map((c) => ({
      type: "candidacy" as const,
      id: c.id,
      label: candidacyLabel(c.candidateName, c.vacancyTitle),
    })),
    ...(task.candidates ?? []).map((c) => ({
      type: "candidate" as const,
      id: c.id,
      label: c.name,
    })),
  ]);
}

/** Every type's list is sent, so saving replaces the Task's attachments. */
export function attachmentsToPayload(
  list: Attachment[],
): Required<TaskAttachmentIds> {
  const idsOf = (type: AttachmentType) =>
    list.filter((a) => a.type === type).map((a) => a.id);
  return {
    candidateIds: idsOf("candidate"),
    vacancyIds: idsOf("vacancy"),
    candidacyIds: idsOf("candidacy"),
    companyIds: idsOf("company"),
  };
}

export function AttachChip({
  a,
  onRemove,
  showType = false,
  className,
}: {
  a: Attachment;
  onRemove?: () => void;
  showType?: boolean;
  className?: string;
}) {
  const meta = ATTACH_META[a.type];
  const Icon = meta.icon;
  return (
    <span
      title={`${meta.label}: ${a.label}${a.sub ? ` (${a.sub})` : ""}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-electric/5 px-1.5 py-0.5 text-[11px] font-medium text-electric ring-1 ring-electric/10",
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="max-w-[180px] truncate">{a.label}</span>
      {showType && (
        <span className="shrink-0 font-normal opacity-70">· {meta.label}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-0.5 ml-0.5 rounded p-0.5 hover:bg-black/5"
          aria-label={`Quitar ${a.label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export function NoAttachChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-dashed border-brand-border px-1.5 py-0.5 text-[11px] text-muted-brand",
        className,
      )}
    >
      <Slash className="h-3 w-3" />
      Sin vincular
    </span>
  );
}

/** Up to `max` chips, then a "+N" chip that pops the rest. */
export function AttachChips({
  attachments,
  max = 2,
  className,
}: {
  attachments: Attachment[];
  max?: number;
  className?: string;
}) {
  if (attachments.length === 0) return <NoAttachChip className={className} />;
  const sorted = sortAttachments(attachments);
  const shown = sorted.slice(0, max);
  const rest = sorted.slice(max);
  return (
    <span
      className={cn("flex min-w-0 flex-wrap items-center gap-1", className)}
    >
      {shown.map((a) => (
        <AttachChip key={attachmentKey(a)} a={a} />
      ))}
      {rest.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex cursor-pointer items-center rounded-md bg-brand-border-light px-1.5 py-0.5 text-[11px] font-semibold text-slate-brand hover:bg-brand-border"
            >
              +{rest.length}
            </span>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto max-w-xs p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-start gap-1">
              {rest.map((a) => (
                <AttachChip key={attachmentKey(a)} a={a} showType />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </span>
  );
}
