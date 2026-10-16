"use client";

import {
  stageOutcome,
  type StageOutcome,
} from "@workspace/shared/lib/opportunity-stage";
import type { OpportunityStage } from "@workspace/shared/types/opportunity";
import { cn } from "@workspace/ui/lib/utils";

const STAGE_TONES: Record<
  StageOutcome,
  { dot: string; text: string; bg: string }
> = {
  open: { dot: "bg-electric", text: "text-electric", bg: "bg-electric/[0.06]" },
  won: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  lost: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
};

export function stageTone(stage: Pick<OpportunityStage, "isWon" | "isLost">) {
  return STAGE_TONES[stageOutcome(stage)];
}

export function StageBadge({
  stage,
  className,
}: {
  stage: OpportunityStage;
  className?: string;
}) {
  const tone = stageTone(stage);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold",
        tone.bg,
        tone.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
      {stage.name}
    </span>
  );
}
