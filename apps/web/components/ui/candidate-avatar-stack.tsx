import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { getInitials } from "@/lib/utils";

interface CandidateAvatarStackProps {
  candidates: { id: number; candidate: { name: string; image?: string } }[];
  max?: number;
}

export function CandidateAvatarStack({
  candidates,
  max = 3,
}: CandidateAvatarStackProps) {
  const visible = candidates.slice(0, max);
  const overflow = candidates.length - visible.length;

  return (
    <div className="flex -space-x-1.5">
      {visible.map((cv) => (
        <Avatar key={cv.id} className="size-6 ring-2 ring-surface">
          {cv.candidate.image && (
            <AvatarImage src={cv.candidate.image} alt={cv.candidate.name} />
          )}
          <AvatarFallback className="bg-brand-border-light text-[9px] font-semibold text-slate-brand">
            {getInitials(cv.candidate.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <div className="flex size-6 items-center justify-center rounded-full bg-brand-border-light ring-2 ring-surface text-[9px] font-semibold text-slate-brand">
          +{overflow}
        </div>
      )}
    </div>
  );
}
