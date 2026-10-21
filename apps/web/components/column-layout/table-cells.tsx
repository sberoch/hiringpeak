"use client";

import type { Column } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

import { formatDay } from "@/lib/format-day";

/**
 * Header and cell builders shared by the list screens' columns (Candidates,
 * Contacts, Companies), so the same kind of column looks the same everywhere.
 */

/** Header of a column the server can sort by: a button with the sort icon. */
export function SortableHeader<TData>({
  column,
  label,
}: {
  column: Column<TData, unknown>;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-auto font-semibold text-slate-brand transition-colors hover:bg-transparent hover:text-ink"
    >
      {label}
      <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
    </Button>
  );
}

/** Header of a column that can't be sorted: plain text, no sort icon. */
export function PlainHeader({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("font-semibold text-slate-brand", className)}>
      {label}
    </span>
  );
}

/** A LinkedIn profile as an absolute https URL, however it was typed. */
export const linkedinUrl = (url: string) =>
  `https://${url.replace(/^https?:\/\//, "")}`;

/** What an empty cell shows: nothing, or a muted placeholder. */
function Empty({ label }: { label?: string }) {
  return label ? <span className="text-muted-brand">{label}</span> : null;
}

export function EmailCell({
  email,
  emptyLabel,
}: {
  email: string | null | undefined;
  emptyLabel?: string;
}) {
  if (!email) return <Empty label={emptyLabel} />;
  return (
    <a
      href={`mailto:${email}`}
      className="text-sm text-ink transition-colors hover:text-electric"
    >
      {email}
    </a>
  );
}

export function PhoneCell({
  phone,
  emptyLabel,
}: {
  phone: string | null | undefined;
  emptyLabel?: string;
}) {
  if (!phone) return <Empty label={emptyLabel} />;
  return <span className="whitespace-nowrap text-sm text-ink">{phone}</span>;
}

export function LinkedInCell({
  linkedin,
  emptyLabel,
}: {
  linkedin: string | null | undefined;
  emptyLabel?: string;
}) {
  if (!linkedin) return <Empty label={emptyLabel} />;
  return (
    <Link
      href={linkedinUrl(linkedin)}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-[220px] truncate text-sm text-ink transition-colors hover:text-electric"
    >
      {linkedin.replace(/^https?:\/\/(www\.)?/, "")}
    </Link>
  );
}

/** The day a record was created ("Fecha de alta"). */
export function CreatedDateCell({ createdAt }: { createdAt: string | Date }) {
  return (
    <span className="whitespace-nowrap tabular-nums text-sm text-slate-brand">
      {formatDay(createdAt)}
    </span>
  );
}
