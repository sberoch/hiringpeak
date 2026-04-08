import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  ClipboardList,
  Edit,
  Mail,
  MapPin,
  MinusCircle,
  Phone,
  PlusCircle,
  Trash,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { CatalogBadge } from "@/components/ui/catalog-badge";
import { CANDIDATE_API_KEY, updateCandidate } from "@/lib/api/candidate";
import { calculateAge } from "@/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import type { Candidate } from "@workspace/shared/types/candidate";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { AddToVacancyDialog } from "../add-to-vacancy-dialog";
import { BlacklistCandidateDialog } from "../blacklist-candidate-dialog";
import { CandidateStars } from "../candidate-stars";
import { DeleteCandidateDialog } from "../delete-candidate-dialog";

interface CandidateDetailHeaderProps {
  candidate: Candidate;
}

export const CandidateDetailToolbar = ({
  candidate,
}: CandidateDetailHeaderProps) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false);
  const [isAddToVacancyDialogOpen, setIsAddToVacancyDialogOpen] =
    useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="brand-ghost"
          className="bg-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Volver
        </Button>
        <Link href={`/candidates/${candidate.id}/edit`}>
          <Button size="sm" variant="brand-ghost" className="bg-white">
            <Edit className="h-4 w-4 mr-1.5" />
            Editar
          </Button>
        </Link>
        <Button
          size="sm"
          variant="brand-ghost"
          className="bg-white"
          onClick={() => setIsAddToVacancyDialogOpen(true)}
        >
          <Briefcase className="h-4 w-4 mr-1.5" />
          Agregar a vacante
        </Button>
        {!candidate.blacklist ? (
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white text-amber-600 hover:bg-amber-50 hover:border-amber-200"
            onClick={() => setIsBlacklistDialogOpen(true)}
          >
            <AlertTriangle className="h-4 w-4 mr-1.5" />
            Blacklist
          </Button>
        ) : (
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white text-amber-600 hover:bg-amber-50 hover:border-amber-200"
          >
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Quitar de blacklist
          </Button>
        )}
        <PermissionGuard permissions={[PermissionCode.CANDIDATE_MANAGE]}>
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white text-red-600 hover:bg-red-50 hover:border-red-200"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4 mr-1.5" />
            Eliminar
          </Button>
        </PermissionGuard>
      </div>

      <DeleteCandidateDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        candidate={candidate}
      />

      <BlacklistCandidateDialog
        isOpen={isBlacklistDialogOpen}
        onClose={() => setIsBlacklistDialogOpen(false)}
        candidate={candidate}
      />

      <AddToVacancyDialog
        open={isAddToVacancyDialogOpen}
        onOpenChange={setIsAddToVacancyDialogOpen}
        candidateId={candidate.id}
        candidateName={candidate.name}
      />
    </>
  );
};

export const CandidateProfileCard = ({
  candidate,
}: CandidateDetailHeaderProps) => {
  const queryClient = useQueryClient();
  const [stars, setStars] = useState(+candidate.stars);

  const { mutate: updateStars } = useMutation<
    Candidate,
    Error,
    number,
    { previousCandidate: Candidate | undefined }
  >({
    mutationFn: async (newStars: number) => {
      return updateCandidate(candidate.id, {
        name: candidate.name,
        dateOfBirth: candidate.dateOfBirth,
        gender: candidate.gender,
        sourceId: candidate.source?.id,
        seniorityIds: candidate.seniorities.map((seniority) => seniority.id),
        areaIds: candidate.areas.map((area) => area.id),
        industryIds: candidate.industries.map((industry) => industry.id),
        stars: newStars,
      });
    },
    onMutate: async (newStars) => {
      await queryClient.cancelQueries({
        queryKey: [CANDIDATE_API_KEY, candidate.id],
      });
      const previousCandidate = queryClient.getQueryData<Candidate>([
        CANDIDATE_API_KEY,
        candidate.id,
      ]);
      queryClient.setQueryData<Candidate>(
        [CANDIDATE_API_KEY, candidate.id],
        (old) => (old ? { ...old, stars: newStars } : old),
      );
      return { previousCandidate };
    },
    onError: (_err, _newStars, context) => {
      if (context?.previousCandidate) {
        queryClient.setQueryData(
          [CANDIDATE_API_KEY, candidate.id],
          context.previousCandidate,
        );
      }
    },
    onSettled: () => {
      queryClient.refetchQueries({
        queryKey: [CANDIDATE_API_KEY, candidate.id],
      });
      queryClient.refetchQueries({
        queryKey: [CANDIDATE_API_KEY],
      });
    },
  });

  const incrementStars = () => {
    if (stars < 5) {
      const newStars = Math.min(stars + 1, 5);
      setStars(newStars);
      updateStars(newStars);
    }
  };

  const decrementStars = () => {
    if (stars > 0) {
      const newStars = Math.max(stars - 1, 0);
      setStars(newStars);
      updateStars(newStars);
    }
  };

  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] h-full">
      <div className="flex flex-col items-center">
        {/* Circular avatar */}
        <div className="relative mb-4">
          <div className="h-36 w-36 overflow-hidden rounded-full border-2 border-brand-border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">
            <Image
              src={candidate.image || "/images/placeholder.svg"}
              alt={candidate.name}
              width={144}
              height={144}
              className="h-full w-full object-cover"
            />
          </div>
          {candidate.blacklist && (
            <Badge
              variant="destructive"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-lg text-[10px]"
            >
              Blacklist
            </Badge>
          )}
          {Boolean(candidate.isInCompanyViaPratt && !candidate.blacklist) && (
            <Badge
              variant="secondary"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-white bg-emerald-500/90 rounded-lg text-[10px]"
            >
              via Pratt
            </Badge>
          )}
        </div>

        {/* Name + LinkedIn */}
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-bold tracking-tight text-ink text-center">
            {candidate.name}
          </h2>
          {candidate.linkedin && (
            <Link
              href={candidate.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0"
            >
              <Image
                src="/images/linkedin.svg"
                alt="LinkedIn"
                width={20}
                height={20}
              />
            </Link>
          )}
        </div>

        {/* Short description */}
        {candidate.shortDescription && (
          <p className="text-sm text-slate-brand leading-relaxed text-center mb-3">
            {candidate.shortDescription}
          </p>
        )}
      </div>

      <Separator className="my-4 bg-brand-border-light" />

      {/* Contact info */}
      <div className="space-y-2.5 text-sm">
        {candidate.countries && candidate.countries.length > 0 && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-brand shrink-0" />
            <span className="text-slate-brand">
              {candidate.countries.join(", ")}
            </span>
          </div>
        )}
        {candidate.dateOfBirth && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-brand shrink-0" />
            <span className="text-slate-brand">
              {calculateAge(candidate.dateOfBirth)} años
            </span>
          </div>
        )}
        {candidate.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-brand shrink-0" />
            <a
              className="text-electric hover:underline truncate"
              href={`mailto:${candidate.email}`}
            >
              {candidate.email}
            </a>
          </div>
        )}
        {candidate.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-brand shrink-0" />
            <span className="text-slate-brand">{candidate.phone}</span>
          </div>
        )}
      </div>

      {/* Languages & Provinces */}
      {((candidate.languages && candidate.languages.length > 0) ||
        (candidate.provinces && candidate.provinces.length > 0)) && (
        <>
          <Separator className="my-4 bg-brand-border-light" />
          <div className="space-y-3">
            {candidate.languages && candidate.languages.length > 0 && (
              <div>
                <span className="text-xs text-muted-brand block mb-1.5">
                  Idiomas
                </span>
                <div className="flex flex-wrap gap-1">
                  {candidate.languages.map((language) => (
                    <Badge
                      key={language}
                      variant="outline"
                      className="text-[11px] h-5 rounded-lg border-brand-border text-slate-brand"
                    >
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {candidate.provinces && candidate.provinces.length > 0 && (
              <div>
                <span className="text-xs text-muted-brand block mb-1.5">
                  Provincias
                </span>
                <div className="flex flex-wrap gap-1">
                  {candidate.provinces.map((province) => (
                    <Badge
                      key={province}
                      variant="outline"
                      className="text-[11px] h-5 rounded-lg border-brand-border text-slate-brand"
                    >
                      {province}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Catalog badges */}
      <Separator className="my-4 bg-brand-border-light" />
      <div className="space-y-3">
        {candidate.seniorities && candidate.seniorities.length > 0 && (
          <div>
            <span className="text-xs text-muted-brand block mb-1.5">
              Seniority
            </span>
            <div className="flex flex-wrap gap-1">
              {candidate.seniorities.map((s) => (
                <CatalogBadge key={s.id} label={s.name} type="seniority" />
              ))}
            </div>
          </div>
        )}

        {candidate.areas && candidate.areas.length > 0 && (
          <div>
            <span className="text-xs text-muted-brand block mb-1.5">
              Áreas
            </span>
            <div className="flex flex-wrap gap-1">
              {candidate.areas.map((a) => (
                <CatalogBadge key={a.id} label={a.name} type="area" />
              ))}
            </div>
          </div>
        )}

        {candidate.industries && candidate.industries.length > 0 && (
          <div>
            <span className="text-xs text-muted-brand block mb-1.5">
              Industrias
            </span>
            <div className="flex flex-wrap gap-1">
              {candidate.industries.map((i) => (
                <CatalogBadge key={i.id} label={i.name} type="industry" />
              ))}
            </div>
          </div>
        )}

        {candidate.source && (
          <div>
            <span className="text-xs text-muted-brand block mb-1.5">
              Fuente
            </span>
            <Badge
              variant="outline"
              className="text-[11px] rounded-lg border-brand-border text-slate-brand"
            >
              {candidate.source.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Star rating */}
      <Separator className="my-4 bg-brand-border-light" />
      <div>
        <span className="text-xs text-muted-brand block mb-2">
          Calificación
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-electric/5 hover:text-electric transition-colors"
            onClick={decrementStars}
            disabled={stars <= 0}
          >
            <MinusCircle className="h-3.5 w-3.5" />
          </Button>
          <CandidateStars stars={stars} size="sm" />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-electric/5 hover:text-electric transition-colors"
            onClick={incrementStars}
            disabled={stars >= 5}
          >
            <PlusCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Keep backward-compatible default export name
export const CandidateDetailHeader = CandidateDetailToolbar;
