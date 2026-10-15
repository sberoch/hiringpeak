"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { createOpportunity, OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { cn } from "@workspace/ui/lib/utils";

import {
  apiErrorMessage,
  defaultOpportunityOwnerId,
  opportunityHref,
  parseMoneyInput,
  useCommercialAccess,
  useCommercialUsers,
} from "./opportunity-ui";

/** "Nueva oportunidad"; on a Company page, pass its id to preselect it. */
export function NewOpportunityButton({
  companyId,
  size,
}: {
  companyId?: number;
  size?: "sm";
} = {}) {
  const { canManage } = useCommercialAccess();
  const [open, setOpen] = useState(false);
  if (!canManage) return null;
  return (
    <>
      <Button variant="brand" size={size} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Nueva oportunidad
      </Button>
      <NewOpportunitySheet
        open={open}
        onOpenChange={setOpen}
        companyId={companyId}
      />
    </>
  );
}

function NewOpportunitySheet({
  open,
  onOpenChange,
  companyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: number;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90%] overflow-y-auto border-brand-border bg-surface sm:w-auto sm:max-w-md">
        <SheetHeader className="px-0">
          <SheetTitle className="text-xl font-bold text-ink">
            Nueva oportunidad
          </SheetTitle>
          <SheetDescription className="text-slate-brand">
            Un posible trabajo para una empresa. Entra en la primera etapa.
          </SheetDescription>
        </SheetHeader>
        {open && (
          <NewOpportunityForm
            initialCompanyId={companyId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function NewOpportunityForm({
  initialCompanyId,
  onDone,
}: {
  initialCompanyId?: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
  const myId =
    session.status === "authenticated" && session.data?.userId
      ? parseInt(session.data.userId, 10)
      : null;

  const { data: companies } = useQuery({
    queryKey: [COMPANIES_API_KEY, { limit: 1e9, page: 1, order: "name:asc" }],
    queryFn: () => getAllCompanies({ limit: 1e9, page: 1, order: "name:asc" }),
  });
  const { data: commercialUsers = [] } = useCommercialUsers();

  const [companyId, setCompanyId] = useState<number | null>(
    initialCompanyId ?? null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [ownerId, setOwnerId] = useState<number | null>(null);

  const company = companies?.items.find((c) => c.id === companyId) ?? null;
  const defaultOwnerId = defaultOpportunityOwnerId(
    company?.accountOwnerId,
    myId,
    commercialUsers,
  );
  const effectiveOwnerId = ownerId ?? defaultOwnerId;
  const fee = parseMoneyInput(amount);
  const feeInvalid = fee != null && (!Number.isFinite(fee) || fee < 0);
  const canSubmit =
    company != null && title.trim() !== "" && !feeInvalid && !!effectiveOwnerId;

  const mutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      toast.success("Oportunidad creada", {
        description: `${created.title} · entra en «${created.stage.name}»`,
        action: {
          label: "Abrir",
          onClick: () => router.push(opportunityHref(created.id)),
        },
      });
      onDone();
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo crear la oportunidad.")),
  });

  const submit = () => {
    if (!canSubmit || !company || !effectiveOwnerId) return;
    mutation.mutate({
      title: title.trim(),
      companyId: company.id,
      estimatedFee: fee,
      ownerId: effectiveOwnerId,
    });
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="space-y-1.5">
        <Label className="text-ink">Empresa</Label>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-surface px-3 text-left text-sm"
            >
              {company ? (
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 text-muted-brand" />
                  {company.name}
                </span>
              ) : (
                <span className="text-muted-brand">Elegí una empresa…</span>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] min-w-[320px] p-0"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Buscar empresa…" />
              <CommandList>
                <CommandEmpty>No hay empresas con ese nombre.</CommandEmpty>
                <CommandGroup>
                  {(companies?.items ?? []).map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.id}`}
                      onSelect={() => {
                        setCompanyId(c.id);
                        setPickerOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          companyId === c.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex-1 truncate">{c.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-opportunity-title" className="text-ink">
          Título
        </Label>
        <Input
          id="new-opportunity-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. CFO post-fusión"
          className="bg-surface"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-opportunity-fee" className="text-ink">
          Fee estimado{" "}
          <span className="font-normal text-muted-brand">(opcional)</span>
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-brand">
            $
          </span>
          <Input
            id="new-opportunity-fee"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            placeholder="15.000.000"
            className="bg-surface pl-7 tabular-nums"
          />
        </div>
        {feeInvalid && (
          <p className="text-xs text-red-600">Ingresá un monto válido.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-ink">Responsable</Label>
        <Select
          value={effectiveOwnerId ? String(effectiveOwnerId) : undefined}
          onValueChange={(v) => setOwnerId(Number(v))}
        >
          <SelectTrigger className="w-full bg-surface">
            <SelectValue placeholder="Elegí un responsable" />
          </SelectTrigger>
          <SelectContent>
            {commercialUsers.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.name}
                {u.id === myId ? " · vos" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-brand">
          {company?.accountOwner
            ? "Por defecto, el responsable de cuenta de la empresa."
            : "Por defecto, vos."}{" "}
          Solo usuarios con acceso al área comercial.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button
          variant="brand"
          disabled={!canSubmit || mutation.isPending}
          onClick={submit}
        >
          Crear oportunidad
        </Button>
      </div>
    </div>
  );
}
