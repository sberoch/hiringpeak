"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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
import type { NetworkContact } from "@workspace/shared/types/contact";

import { COMPANIES_API_KEY, getCompanyById } from "@/lib/api/company";
import { CONTACT_API_KEY } from "@/lib/api/contact";
import {
  createOpportunityFromContact,
  OPPORTUNITY_API_KEY,
} from "@/lib/api/opportunity";
import {
  apiErrorMessage,
  defaultOpportunityOwnerId,
  opportunityHref,
  parseMoneyInput,
  useCommercialUsers,
} from "../opportunities/opportunity-ui";
import { useCurrentUserId } from "./contact-lookups";
import {
  CompanyPicker,
  companyChoicePayload,
  type CompanyChoice,
} from "./contact-pickers";

type Created = {
  id: number;
  title: string;
  companyName: string;
  becameCompany: boolean;
};

/**
 * "Crear oportunidad" from a Contact. An Opportunity belongs to one Company:
 * the Contact's, or, when they have none, one picked or created here, which
 * also becomes theirs. The Contact is added to the Opportunity.
 */
export function CreateOpportunityDialog({
  contact,
  open,
  onOpenChange,
}: {
  contact: NetworkContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <CreateOpportunityForm
            contact={contact}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateOpportunityForm({
  contact,
  onClose,
}: {
  contact: NetworkContact;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const me = useCurrentUserId();
  const { data: commercialUsers = [] } = useCommercialUsers();
  const firstName = contact.name.split(" ")[0];
  const hasCompany = contact.company != null;

  const [company, setCompany] = useState<CompanyChoice>({ kind: "none" });
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [created, setCreated] = useState<Created | null>(null);

  // Opportunity Owner defaults to the Company's Account Owner, else the creator.
  const targetCompanyId =
    contact.company?.id ?? (company.kind === "existing" ? company.id : null);
  const { data: targetCompany } = useQuery({
    queryKey: [COMPANIES_API_KEY, String(targetCompanyId)],
    queryFn: () => getCompanyById(String(targetCompanyId)),
    enabled: targetCompanyId != null,
  });
  const accountOwnerId =
    targetCompanyId != null && targetCompany?.id === targetCompanyId
      ? targetCompany.accountOwnerId
      : null;
  const defaultOwnerId = defaultOpportunityOwnerId(
    accountOwnerId,
    me,
    commercialUsers,
  );
  const effectiveOwnerId = ownerId ?? defaultOwnerId;
  const fee = parseMoneyInput(amount);
  const feeInvalid = fee != null && (!Number.isFinite(fee) || fee < 0);
  const companyReady = hasCompany || company.kind !== "none";
  const canSubmit =
    companyReady && title.trim() !== "" && !feeInvalid && !!effectiveOwnerId;

  const mutation = useMutation({
    mutationFn: () =>
      createOpportunityFromContact(contact.id, {
        title: title.trim(),
        estimatedFee: fee,
        ownerId: effectiveOwnerId ?? undefined,
        ...(hasCompany ? {} : companyChoicePayload(company)),
      }),
    onSuccess: (opportunity) => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      if (!hasCompany) {
        queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
        queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
      }
      setCreated({
        id: opportunity.id,
        title: opportunity.title,
        companyName: opportunity.company.name,
        becameCompany: !hasCompany,
      });
      toast.success("Oportunidad creada", {
        description: `«${opportunity.title}» en ${opportunity.company.name}, con ${contact.name}.`,
      });
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo crear la oportunidad.")),
  });

  if (created) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Oportunidad creada</DialogTitle>
          <DialogDescription>
            «{created.title}» en {created.companyName}. {contact.name} ya figura
            en ella.
          </DialogDescription>
        </DialogHeader>
        {created.becameCompany && (
          <p className="flex items-start gap-2 rounded-xl bg-electric/[0.06] px-3 py-2.5 text-sm text-ink ring-1 ring-electric/20">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
            <span>
              {created.companyName} es ahora la empresa de {firstName}.
            </span>
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Seguir en {firstName}
          </Button>
          <Button asChild variant="brand">
            <Link href={opportunityHref(created.id)}>
              Ver oportunidad
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Crear oportunidad</DialogTitle>
        <DialogDescription>
          {hasCompany ? (
            <>
              En{" "}
              <span className="font-semibold text-ink">
                {contact.company!.name}
              </span>
              , con {contact.name} ya agregado.
            </>
          ) : (
            <>
              Una oportunidad siempre es con una empresa. {contact.name} queda
              agregado automáticamente.
            </>
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {!hasCompany && (
          <div className="space-y-2 rounded-xl border border-brand-border p-3">
            <Label className="text-sm font-medium text-ink">Empresa</Label>
            <CompanyPicker value={company} onChange={setCompany} />
            {company.kind === "new" && (
              <p className="text-[11px] text-muted-brand">
                Se crea como prospecto. Completás el resto de sus datos después.
              </p>
            )}
            <p className="flex items-start gap-1.5 text-xs text-slate-brand">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              También pasa a ser la empresa de {firstName}, que hoy no tiene
              ninguna.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="opportunity-from-contact-title">Título</Label>
          <Input
            id="opportunity-from-contact-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Gerente de Operaciones"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="opportunity-from-contact-fee">
              Fee estimado{" "}
              <span className="font-normal text-muted-brand">(opcional)</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-brand">
                $
              </span>
              <Input
                id="opportunity-from-contact-fee"
                inputMode="numeric"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^\d.,]/g, ""))
                }
                placeholder="Sin estimar"
                className="pl-7 tabular-nums"
              />
            </div>
            {feeInvalid && (
              <p className="text-xs text-red-600">Ingresá un monto válido.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <Select
              value={effectiveOwnerId ? String(effectiveOwnerId) : undefined}
              onValueChange={(value) => setOwnerId(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí un responsable" />
              </SelectTrigger>
              <SelectContent>
                {commercialUsers.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                    {user.id === me ? " (vos)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="brand"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Crear oportunidad
        </Button>
      </DialogFooter>
    </>
  );
}
