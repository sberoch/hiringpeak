"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import type {
  CreateContactDto,
  NetworkContact,
} from "@workspace/shared/types/contact";

import { COMPANIES_API_KEY } from "@/lib/api/company";
import {
  CONTACT_API_KEY,
  createContact,
  updateContact,
} from "@/lib/api/contact";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";
import { useCurrentUserId } from "./contact-lookups";
import {
  CompanyPicker,
  companyChoicePayload,
  DuplicateNotice,
  OwnerPicker,
  SourcePicker,
  useContactDuplicates,
  type CompanyChoice,
} from "./contact-pickers";

type Draft = {
  name: string;
  role: string;
  company: CompanyChoice;
  email: string;
  phone: string;
  linkedin: string;
  sourceId: number | null;
  /** Untouched (`undefined`) means "me": the API defaults it to the creator. */
  ownerId: number | null | undefined;
  shortDescription: string;
};

function emptyDraft(): Draft {
  return {
    name: "",
    role: "",
    company: { kind: "none" },
    email: "",
    phone: "",
    linkedin: "",
    sourceId: null,
    ownerId: undefined,
    shortDescription: "",
  };
}

function draftFromContact(contact: NetworkContact): Draft {
  return {
    name: contact.name,
    role: contact.role,
    company:
      contact.companyId != null
        ? { kind: "existing", id: contact.companyId }
        : { kind: "none" },
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    linkedin: contact.linkedin ?? "",
    sourceId: contact.sourceId,
    ownerId: contact.ownerId,
    shortDescription: contact.shortDescription ?? "",
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Saving needs a name and, when given, a valid email. */
function draftProblem(draft: Draft): string | null {
  if (!draft.name.trim()) return "Falta el nombre";
  if (draft.email.trim() && !EMAIL_PATTERN.test(draft.email.trim()))
    return "El email no es válido";
  return null;
}

function draftPayload(draft: Draft): CreateContactDto {
  return {
    ...companyChoicePayload(draft.company),
    name: draft.name.trim(),
    role: draft.role.trim(),
    email: draft.email.trim() || null,
    phone: draft.phone.trim() || null,
    linkedin: draft.linkedin.trim() || null,
    sourceId: draft.sourceId,
    ownerId: draft.ownerId,
    shortDescription: draft.shortDescription.trim() || null,
  };
}

function errorMessage(error: unknown, fallback: string) {
  const message = (
    error as { response?: { data?: { message?: unknown } } } | undefined
  )?.response?.data?.message;
  return typeof message === "string" ? message : fallback;
}

interface ContactCaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this Contact; omit for the "Nuevo contacto" quick capture. */
  contact?: NetworkContact;
}

/**
 * "Nuevo contacto": quick capture of one person at a time, with "Guardar y
 * cargar otro" to keep the sheet open and empty for the next card. With
 * `contact`, a plain edit of every field, Company included.
 */
export function ContactCaptureSheet({
  open,
  onOpenChange,
  contact,
}: ContactCaptureSheetProps) {
  const me = useCurrentUserId();
  const isEdit = !!contact;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() =>
    contact ? draftFromContact(contact) : emptyDraft(),
  );
  /** Bumped on every reset so inputs remount (autofocus on name). */
  const [formKey, setFormKey] = useState(0);
  const [batch, setBatch] = useState<{ id: number; name: string }[]>([]);
  const set = (patch: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const problem = draftProblem(draft);
  const duplicates = useContactDuplicates({
    name: isEdit ? "" : draft.name,
    email: isEdit ? "" : draft.email,
    linkedin: isEdit ? "" : draft.linkedin,
  });

  const reset = () => {
    setDraft(contact ? draftFromContact(contact) : emptyDraft());
    setFormKey((key) => key + 1);
  };

  const close = () => {
    onOpenChange(false);
    reset();
    setBatch([]);
  };

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
  };

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: (args: { payload: CreateContactDto; another: boolean }) =>
      createContact(args.payload),
    onSuccess: (created, { another }) => {
      toast.success(`${created.name} guardado`);
      if (created.duplicates.length > 0) {
        toast.warning("Puede que ya lo tuvieras cargado", {
          description: created.duplicates
            .map((duplicate) => duplicate.name)
            .join(", "),
        });
      }
      invalidate();
      if (!another) return close();
      setBatch((current) => [
        ...current,
        { id: created.id, name: created.name },
      ]);
      reset();
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo guardar el contacto.")),
  });

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: (payload: CreateContactDto) =>
      updateContact(contact!.id, payload),
    onSuccess: (saved) => {
      toast.success("Contacto actualizado", { description: saved.name });
      invalidate();
      onOpenChange(false);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo guardar el contacto.")),
  });

  const isPending = isCreating || isUpdating;
  const submit = (another: boolean) => {
    if (problem || isPending) return;
    const payload = draftPayload(draft);
    if (isEdit) update(payload);
    else create({ payload, another });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <SheetContent className="w-[90%] overflow-y-auto border-brand-border bg-surface sm:w-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-ink">
            {isEdit ? "Editar contacto" : "Nuevo contacto"}
          </SheetTitle>
          <SheetDescription className="text-slate-brand">
            {isEdit
              ? "Si cambió de trabajo, elegí su nueva empresa."
              : "Cargá las tarjetas de a una. «Guardar y cargar otro» deja el formulario vacío para el siguiente."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          {batch.length > 0 && (
            <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <span className="font-semibold">
                {batch.length} cargado{batch.length > 1 ? "s" : ""} en esta
                tanda:
              </span>{" "}
              {batch.map((saved, index) => (
                <span key={saved.id}>
                  {index > 0 && ", "}
                  <Link
                    href={`/contacts/${saved.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {saved.name}
                  </Link>
                </span>
              ))}
            </div>
          )}

          <div key={formKey} className="grid grid-cols-2 gap-3">
            <Field label="Nombre" className="col-span-2">
              <Input
                autoFocus
                value={draft.name}
                onChange={(event) => set({ name: event.target.value })}
                placeholder="Nombre y apellido"
              />
            </Field>
            <Field label="Cargo">
              <Input
                value={draft.role}
                onChange={(event) => set({ role: event.target.value })}
                placeholder="Ej. CFO"
              />
            </Field>
            <Field label="Empresa" hint="opcional">
              <CompanyPicker
                value={draft.company}
                onChange={(company) => set({ company })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(event) => set({ email: event.target.value })}
                placeholder="nombre@empresa.com"
              />
            </Field>
            <Field label="Teléfono">
              <Input
                value={draft.phone}
                onChange={(event) => set({ phone: event.target.value })}
                placeholder="+54 9 11…"
              />
            </Field>
            <Field label="LinkedIn" className="col-span-2">
              <Input
                value={draft.linkedin}
                onChange={(event) => set({ linkedin: event.target.value })}
                placeholder="linkedin.com/in/…"
              />
            </Field>
          </div>

          {!isEdit && <DuplicateNotice duplicates={duplicates} />}

          <Field label="Origen">
            <SourcePicker
              value={draft.sourceId}
              onChange={(sourceId) => set({ sourceId })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Responsable">
              <OwnerPicker
                value={draft.ownerId === undefined ? me : draft.ownerId}
                onChange={(ownerId) => set({ ownerId })}
              />
            </Field>
          </div>
          <Field label="Descripción corta">
            <Textarea
              value={draft.shortDescription}
              onChange={(event) =>
                set({ shortDescription: event.target.value })
              }
              rows={2}
              placeholder="Quién es y por qué nos interesa"
            />
          </Field>
        </div>

        <SheetFooter className="sticky bottom-0 flex-row items-center gap-2 border-t border-brand-border bg-surface">
          {problem && draft.name.trim() ? (
            <p className="mr-auto text-xs text-red-600">{problem}</p>
          ) : (
            <span className="mr-auto" />
          )}
          {!isEdit && (
            <Button
              variant="outline"
              disabled={!!problem || isPending}
              onClick={() => submit(true)}
            >
              <Plus className="h-4 w-4" />
              Guardar y cargar otro
            </Button>
          )}
          <Button
            className="bg-electric text-white hover:bg-electric-light"
            disabled={!!problem || isPending}
            onClick={() => submit(false)}
          >
            {isPending
              ? "Guardando..."
              : isEdit
                ? "Guardar cambios"
                : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <Label className="text-ink">
        {label}
        {hint && <span className="font-normal text-muted-brand">({hint})</span>}
      </Label>
      {children}
    </div>
  );
}
