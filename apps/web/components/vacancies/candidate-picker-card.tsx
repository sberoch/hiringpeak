"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Mail, Phone } from "lucide-react";

import { CandidateStars } from "@/components/candidates/candidate-stars";
import { cn, getInitials } from "@/lib/utils";
import type { Candidate } from "@workspace/shared/types/candidate";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";

interface CandidatePickerCardProps {
  candidate: Candidate;
  isSelected: boolean;
  onToggle: () => void;
}

export function CandidatePickerCard({
  candidate,
  isSelected,
  onToggle,
}: CandidatePickerCardProps) {
  const badgeToShow = candidate.blacklist
    ? "blacklisted"
    : candidate.isInCompanyViaPratt
      ? "via-pratt"
      : null;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface text-left outline-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-electric/25 hover:shadow-[0_12px_32px_-12px_rgba(0,102,255,0.18)]",
        "focus-visible:ring-2 focus-visible:ring-electric/30 focus-visible:ring-offset-2",
        {
          "border-red-300/80": candidate.blacklist,
          "border-emerald-300/80":
            candidate.isInCompanyViaPratt && !candidate.blacklist,
          "border-brand-border": !candidate.blacklist && !candidate.isInCompanyViaPratt,
          "border-electric ring-2 ring-electric/20 shadow-[0_8px_28px_-10px_rgba(0,102,255,0.35)]":
            isSelected,
        },
      )}
    >
      {/* Photo */}
      <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-canvas to-brand-border-light">
        {candidate.image ? (
          <Image
            src={candidate.image}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar className="h-20 w-20 border-2 border-white/80 shadow-sm">
              <AvatarFallback className="bg-electric/10 text-xl font-bold text-electric">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-60" />

        {badgeToShow === "blacklisted" ? (
          <Badge
            variant="destructive"
            className="absolute left-3 top-3 rounded-lg border-0 text-[10px] font-bold uppercase tracking-wide shadow-sm"
          >
            Blacklist
          </Badge>
        ) : null}
        {badgeToShow === "via-pratt" ? (
          <Badge className="absolute left-3 top-3 rounded-lg border-0 bg-emerald-500 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm hover:bg-emerald-500">
            via Pratt
          </Badge>
        ) : null}

        <div
          className={cn(
            "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200",
            isSelected
              ? "border-white bg-electric text-white shadow-md scale-100"
              : "border-white/90 bg-white/90 text-transparent scale-95 group-hover:scale-100 group-hover:border-electric/40",
          )}
          aria-hidden
        >
          <Check className={cn("h-4 w-4", !isSelected && "opacity-0")} strokeWidth={2.5} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/candidates/${candidate.id}`}
              target="_blank"
              className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-ink transition-colors hover:text-electric"
              onClick={(event) => event.stopPropagation()}
            >
              {candidate.name}
            </Link>
            <div className="mt-1.5">
              <CandidateStars stars={+candidate.stars} size="sm" />
            </div>
          </div>
          {candidate.linkedin ? (
            <Link
              href={candidate.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-canvas text-electric/80 transition-colors hover:border-electric/30 hover:bg-electric/5 hover:text-electric"
              aria-label="LinkedIn"
              onClick={(event) => event.stopPropagation()}
            >
              <Image src="/images/linkedin.svg" alt="" width={18} height={18} />
            </Link>
          ) : null}
        </div>

        {candidate.shortDescription ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-slate-brand">
            {candidate.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto space-y-1.5">
          {candidate.email ? (
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-canvas px-2.5 py-1.5 text-xs text-slate-brand">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-brand" />
              <span className="min-w-0 truncate">{candidate.email}</span>
            </div>
          ) : null}
          {candidate.phone ? (
            <div className="flex min-w-0 items-center gap-2 rounded-lg bg-canvas px-2.5 py-1.5 text-xs text-slate-brand">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-brand" />
              <span className="min-w-0 truncate">{candidate.phone}</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
