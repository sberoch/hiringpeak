"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Lock, Plus, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { usePermissions } from "@/contexts/permission-context";
import { PermissionCode } from "@workspace/shared/enums";
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
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import { cn } from "@workspace/ui/lib/utils";

/** Settings «Comercial» screens: rendered only for users with CRM_MANAGE. */
export function CrmManageOnly({ children }: { children: ReactNode }) {
  const { hasPermission, isLoading } = usePermissions();
  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }
  if (hasPermission(PermissionCode.CRM_MANAGE)) return <>{children}</>;
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-8 text-center">
      <Lock className="mx-auto h-6 w-6 text-muted-brand" />
      <p className="mt-3 text-lg font-bold text-ink">Sin acceso</p>
      <p className="mt-1 text-sm text-slate-brand">
        Solo quien administra el área comercial puede configurar esta sección.
      </p>
    </div>
  );
}

/** Card + heading every settings page wraps its content in. */
export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-brand">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

export function SettingsToolbar({
  search,
  onSearch,
  placeholder,
  onAdd,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
        <input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-xl border border-brand-border bg-canvas py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition-all duration-200 placeholder:text-muted-brand focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.08)]"
        />
      </div>
      <button
        onClick={onAdd}
        className="inline-flex shrink-0 items-center gap-2 rounded-md bg-electric px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-electric-light hover:shadow-[0_12px_32px_-8px_rgba(0,102,255,0.4)]"
      >
        <Plus className="h-4 w-4" />
        Agregar
      </button>
    </div>
  );
}

export function NoResults({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-border-light">
        <Search className="h-5 w-5 text-muted-brand" />
      </div>
      <p className="text-sm font-medium text-ink">Sin resultados</p>
      <p className="mt-0.5 text-xs text-muted-brand">{text}</p>
    </div>
  );
}

export function RowIconButton({
  onClick,
  danger,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg text-slate-brand transition-colors disabled:cursor-not-allowed disabled:opacity-35",
        danger
          ? "enabled:hover:bg-red-50 enabled:hover:text-red-500"
          : "hover:bg-electric/10 hover:text-electric",
      )}
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}

/** "3 oportunidades" pill; muted when zero. */
export function UsagePill({
  n,
  one,
  many,
}: {
  n: number;
  one: string;
  many: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        n > 0
          ? "bg-electric/[0.07] text-electric"
          : "bg-brand-border-light text-muted-brand",
      )}
    >
      {n} {n === 1 ? one : many}
    </span>
  );
}

export function useListSensors() {
  return useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
}

/** Add / rename dialog with a single "Nombre" field. */
export function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  initial = "",
  placeholder,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  initial?: string;
  placeholder?: string;
  saving?: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  useEffect(() => {
    if (open) setName(initial);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-ink">{title}</DialogTitle>
          <DialogDescription className="text-slate-brand">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave(name.trim());
          }}
        >
          <div className="py-4">
            <Label
              htmlFor="settings-name"
              className="text-sm font-semibold text-ink"
            >
              Nombre
            </Label>
            <Input
              id="settings-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={placeholder}
              className="mt-2 rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-md border-brand-border text-ink hover:bg-brand-border-light"
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
