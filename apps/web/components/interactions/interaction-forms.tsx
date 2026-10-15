"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { NetworkContact } from "@workspace/shared/types/contact";
import type {
  Opportunity,
  OpportunityListItem,
} from "@workspace/shared/types/opportunity";

import { useCompanyOptions } from "@/components/contacts/contact-lookups";
import { getOpportunities, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import {
  ContactChips,
  emptyInteractionDraft,
  interactionDraftProblem,
  InteractionFields,
  NetworkContactAdder,
  useCompanyContacts,
  useCreateInteraction,
  type ContactOption,
  type InteractionDraft,
} from "./interaction-ui";

function toggle(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** Opportunities of a Company, open ones first (for "Oportunidad (opcional)"). */
function useCompanyOpportunities(companyId: number | null) {
  const { data } = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, { companyId }],
    queryFn: () => getOpportunities({ companyId: companyId ?? undefined }),
    enabled: companyId != null,
  });
  return companyId == null ? [] : (data ?? []);
}

function OpportunitySelect({
  opportunities,
  value,
  onChange,
}: {
  opportunities: OpportunityListItem[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const open = opportunities.filter((o) => !o.stage.isWon && !o.stage.isLost);
  const closed = opportunities.filter((o) => o.stage.isWon || o.stage.isLost);
  return (
    <Select
      value={value == null ? "none" : String(value)}
      onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
    >
      <SelectTrigger className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Ninguna</SelectItem>
        {open.length > 0 && (
          <SelectGroup>
            <SelectLabel>Abiertas</SelectLabel>
            {open.map((o) => (
              <SelectItem key={o.id} value={String(o.id)}>
                {o.title}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {closed.length > 0 && (
          <SelectGroup>
            <SelectLabel>Cerradas</SelectLabel>
            {closed.map((o) => (
              <SelectItem key={o.id} value={String(o.id)}>
                {o.title} · {o.stage.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-ink">
        {label}
        {hint && (
          <span className="ml-1 font-normal text-muted-brand">{hint}</span>
        )}
      </p>
      {children}
    </div>
  );
}

function SubmitRow({
  draft,
  pending,
  onSubmit,
  onCancel,
}: {
  draft: InteractionDraft;
  pending: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
}) {
  const problem = interactionDraftProblem(draft);
  return (
    <div className="ml-auto flex items-center gap-2">
      {onCancel && (
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      )}
      <Button
        size="sm"
        variant="brand"
        disabled={!!problem || pending}
        title={problem ?? undefined}
        onClick={onSubmit}
      >
        {pending ? "Registrando..." : "Registrar interacción"}
      </Button>
    </div>
  );
}

/**
 * The Opportunity page's composer: recorded on the Opportunity's Company and
 * tied to it; "Con:" picks among the Company's current Contacts.
 */
export function OpportunityInteractionComposer({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const [draft, setDraft] = useState(emptyInteractionDraft);
  const [contactIds, setContactIds] = useState<number[]>([]);
  const contacts = useCompanyContacts(opportunity.companyId);
  const create = useCreateInteraction(() => {
    setDraft(emptyInteractionDraft());
    setContactIds([]);
  });

  const submit = () => {
    if (interactionDraftProblem(draft) || create.isPending) return;
    create.mutate({
      ...draft,
      summary: draft.summary.trim(),
      contactIds,
      companyId: opportunity.companyId,
      opportunityId: opportunity.id,
    });
  };

  return (
    <div className="space-y-3">
      <InteractionFields value={draft} onChange={setDraft} />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-slate-brand">Con:</span>
        <ContactChips
          options={contacts.map((c) => ({ id: c.id, name: c.name }))}
          selected={contactIds}
          onToggle={(id) => setContactIds((ids) => toggle(ids, id))}
        />
        <SubmitRow draft={draft} pending={create.isPending} onSubmit={submit} />
      </div>
    </div>
  );
}

/**
 * "Registrar interacción" from the Company page: the Company is preselected
 * and the user picks its Contacts or anyone else in the network. Unticking the
 * Company lets the API default to the Contacts' shared current Company.
 */
export function CompanyInteractionDialog({
  company,
  open,
  onOpenChange,
}: {
  company: { id: number; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState(emptyInteractionDraft);
  const [withCompany, setWithCompany] = useState(true);
  const [contactIds, setContactIds] = useState<number[]>([]);
  const [others, setOthers] = useState<ContactOption[]>([]);
  const [opportunityId, setOpportunityId] = useState<number | null>(null);
  const current = useCompanyContacts(company.id);
  const opportunities = useCompanyOpportunities(company.id);

  const reset = () => {
    setDraft(emptyInteractionDraft());
    setWithCompany(true);
    setContactIds([]);
    setOthers([]);
    setOpportunityId(null);
  };
  const close = () => {
    onOpenChange(false);
    reset();
  };
  const create = useCreateInteraction(close);

  const options: ContactOption[] = [
    ...current.map((c) => ({
      id: c.id,
      name: c.name,
      hint: c.role || undefined,
    })),
    ...others,
  ];
  const nobody = !withCompany && contactIds.length === 0;

  const submit = () => {
    if (interactionDraftProblem(draft) || nobody || create.isPending) return;
    create.mutate({
      ...draft,
      summary: draft.summary.trim(),
      contactIds,
      ...(withCompany ? { companyId: company.id, opportunityId } : {}),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar interacción</DialogTitle>
          <DialogDescription>
            Algo que ya pasó con {company.name}. Podés cargarla con fecha
            pasada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <InteractionFields value={draft} onChange={setDraft} autoFocus />

          <div className="space-y-3 rounded-xl border border-brand-border p-3">
            <p className="text-sm font-medium text-ink">Con quién</p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <Checkbox
                checked={withCompany}
                onCheckedChange={(v) => setWithCompany(v === true)}
              />
              {company.name}
              <span className="text-xs text-muted-brand">(la empresa)</span>
            </label>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-brand">Contactos</p>
              <ContactChips
                options={options}
                selected={contactIds}
                onToggle={(id) => setContactIds((ids) => toggle(ids, id))}
              />
              <NetworkContactAdder
                excludeIds={options.map((c) => c.id)}
                onAdd={(contact) => {
                  setOthers((list) => [...list, contact]);
                  setContactIds((ids) => [...ids, contact.id]);
                }}
              />
            </div>
            {!withCompany && (
              <p className="text-xs text-muted-brand">
                Sin la empresa, la interacción queda con la empresa actual de
                los contactos elegidos (o sin empresa).
              </p>
            )}
            {nobody && (
              <p className="text-xs text-red-600">
                Elegí al menos un contacto o la empresa.
              </p>
            )}
          </div>

          {withCompany && opportunities.length > 0 && (
            <Field label="Oportunidad" hint="(opcional)">
              <OpportunitySelect
                opportunities={opportunities}
                value={opportunityId}
                onChange={setOpportunityId}
              />
            </Field>
          )}

          <div className="flex">
            <SubmitRow
              draft={draft}
              pending={create.isPending || nobody}
              onSubmit={submit}
              onCancel={close}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Registrar interacción" from the Contact page: with this Contact (and
 * optionally others), at their current Company by default.
 */
export function ContactInteractionDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: NetworkContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState(emptyInteractionDraft);
  const [others, setOthers] = useState<ContactOption[]>([]);
  const [companyId, setCompanyId] = useState<number | null>(contact.companyId);
  const [opportunityId, setOpportunityId] = useState<number | null>(null);
  const companies = useCompanyOptions();
  const opportunities = useCompanyOpportunities(companyId);

  const reset = () => {
    setDraft(emptyInteractionDraft());
    setOthers([]);
    setCompanyId(contact.companyId);
    setOpportunityId(null);
  };
  const close = () => {
    onOpenChange(false);
    reset();
  };
  const create = useCreateInteraction(close);

  const submit = () => {
    if (interactionDraftProblem(draft) || create.isPending) return;
    create.mutate({
      ...draft,
      summary: draft.summary.trim(),
      contactIds: [contact.id, ...others.map((c) => c.id)],
      companyId,
      opportunityId,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar interacción</DialogTitle>
          <DialogDescription>
            Algo que ya pasó con {contact.name}. Podés cargarla con fecha
            pasada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <InteractionFields value={draft} onChange={setDraft} autoFocus />

          <Field label="Con">
            <div className="flex flex-wrap items-center gap-1.5">
              <ContactChips
                options={[{ id: contact.id, name: contact.name }, ...others]}
                selected={[contact.id, ...others.map((c) => c.id)]}
                onToggle={(id) =>
                  id !== contact.id &&
                  setOthers((list) => list.filter((c) => c.id !== id))
                }
              />
            </div>
            <NetworkContactAdder
              excludeIds={[contact.id, ...others.map((c) => c.id)]}
              onAdd={(other) => setOthers((list) => [...list, other])}
              placeholder="Agregar a alguien más…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Empresa">
              <Select
                value={companyId == null ? "none" : String(companyId)}
                onValueChange={(v) => {
                  setCompanyId(v === "none" ? null : Number(v));
                  setOpportunityId(null);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin empresa</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {companyId != null && opportunities.length > 0 && (
              <Field label="Oportunidad" hint="(opcional)">
                <OpportunitySelect
                  opportunities={opportunities}
                  value={opportunityId}
                  onChange={setOpportunityId}
                />
              </Field>
            )}
          </div>

          <div className="flex">
            <SubmitRow
              draft={draft}
              pending={create.isPending}
              onSubmit={submit}
              onCancel={close}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
