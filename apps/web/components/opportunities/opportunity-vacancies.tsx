"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { VacancyContactPicker } from "@/components/vacancies/wizard/vacancy-contact-picker";
import { COMPANIES_API_KEY } from "@/lib/api/company";
import {
  createVacancyFromOpportunity,
  OPPORTUNITY_API_KEY,
} from "@/lib/api/opportunity";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import { VACANCY_API_KEY } from "@/lib/api/vacancy";
import type { OpportunityDetail } from "@workspace/shared/types/opportunity";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";

import { apiErrorMessage } from "./opportunity-ui";

/**
 * The Vacancies a won Opportunity produced. "Crear vacante" shows only while
 * the Opportunity is won; Vacancies stay listed (and untouched) if it leaves won.
 */
export function OpportunityVacanciesCard({
  opportunity,
  canManage,
}: {
  opportunity: OpportunityDetail;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isWon = opportunity.stage.isWon;
  const { vacancies } = opportunity;

  return (
    <section className="max-w-xl rounded-2xl border border-brand-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-muted-brand" />
        <h2 className="flex-1 text-sm font-semibold text-ink">
          Vacantes
          <span className="ml-1.5 font-normal text-muted-brand">
            {vacancies.length}
          </span>
        </h2>
        {canManage && isWon && (
          <Button
            size="sm"
            variant="brand"
            className="h-7 px-2.5 text-xs"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Crear vacante
          </Button>
        )}
      </div>

      {!isWon && vacancies.length > 0 && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Esta oportunidad ya no está ganada, pero sus vacantes siguen igual:
          los cambios de etapa no las afectan. No se pueden crear vacantes
          nuevas hasta volver a ganarla.
        </p>
      )}

      {vacancies.length === 0 ? (
        <p className="py-2 text-center text-xs text-slate-brand">
          {isWon
            ? "Ganada y sin vacantes todavía."
            : "Las vacantes se crean cuando la oportunidad está ganada."}
        </p>
      ) : (
        <ul className="divide-y divide-brand-border">
          {vacancies.map((vacancy) => (
            <li key={vacancy.id}>
              <Link
                href={`/vacancies/${vacancy.id}`}
                className="group block py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink group-hover:text-electric">
                    {vacancy.title}
                  </span>
                  {vacancy.status && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                        vacancy.status.isFinal
                          ? "bg-slate-100 text-slate-600"
                          : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {vacancy.status.name}
                    </span>
                  )}
                  <ExternalLink className="h-3 w-3 text-muted-brand" />
                </div>
                <p className="mt-0.5 text-xs text-slate-brand">
                  {vacancy.assignedTo.name}
                  {vacancy.vacancyContact
                    ? ` · Contacto: ${vacancy.vacancyContact.name}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {canManage && isWon && (
        <CreateVacancyDialog
          opportunity={opportunity}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </section>
  );
}

function CreateVacancyDialog({
  opportunity,
  open,
  onOpenChange,
}: {
  opportunity: OpportunityDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(opportunity.title);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);

  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createVacancyFromOpportunity(opportunity.id, {
        title: title.trim(),
        assignedTo: ownerId!,
        vacancyContactId: contactId,
      }),
    onSuccess: (vacancy) => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
      toast.success("Vacante creada", {
        description: `«${vacancy.title}» quedó vinculada a esta oportunidad.`,
      });
      onOpenChange(false);
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo crear la vacante.")),
  });

  const canSubmit = !!title.trim() && ownerId != null && !mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setTitle(opportunity.title);
          setOwnerId(null);
          setContactId(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear vacante</DialogTitle>
          <DialogDescription>
            Desde «{opportunity.title}» ({opportunity.company.name}). Se crea
            una por vez; podés crear otra después.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título de la vacante</Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Responsable de la vacante</Label>
            <Select
              value={ownerId?.toString()}
              onValueChange={(value) => setOwnerId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elegí quién lleva la búsqueda" />
              </SelectTrigger>
              <SelectContent>
                {users?.items.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name ?? user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-brand">
              Cualquier usuario, incluidos reclutadores sin acceso comercial.
            </p>
          </div>
          <VacancyContactPicker
            companyId={opportunity.companyId}
            value={contactId}
            onChange={setContactId}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="brand"
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            Crear vacante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
