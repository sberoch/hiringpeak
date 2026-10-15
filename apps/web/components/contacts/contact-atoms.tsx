"use client";

import { Copy, Linkedin, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@workspace/ui/lib/utils";
import { getInitials } from "@/lib/utils";

/** Click-to-copy email or phone. Useful for everyone, recruiters included. */
export function CopyChip({
  value,
  kind,
  className,
}: {
  value: string | null | undefined;
  kind: "email" | "phone";
  className?: string;
}) {
  const Icon = kind === "email" ? Mail : Phone;
  const label = kind === "email" ? "Email" : "Teléfono";
  if (!value) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-muted-brand",
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5" />—
      </span>
    );
  }
  return (
    <button
      type="button"
      title={`Copiar ${label.toLowerCase()}`}
      onClick={(event) => {
        event.stopPropagation();
        void navigator.clipboard?.writeText(value);
        toast.success(`${label} copiado`, { description: value });
      }}
      className={cn(
        "group/copy inline-flex max-w-full items-center gap-1.5 rounded-md text-left text-xs text-slate-brand transition-colors hover:text-electric",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value}</span>
      <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/copy:opacity-100" />
    </button>
  );
}

export function LinkedinLink({
  url,
  className,
}: {
  url: string | null | undefined;
  className?: string;
}) {
  if (!url) return null;
  return (
    <a
      href={`https://${url.replace(/^https?:\/\//, "")}`}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      title={url}
      className={cn(
        "inline-flex items-center gap-1 text-xs text-slate-brand hover:text-electric",
        className,
      )}
    >
      <Linkedin className="h-3.5 w-3.5" />
      LinkedIn
    </a>
  );
}

export function ContactAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 ring-1 ring-brand-border",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
