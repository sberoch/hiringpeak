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
import { PageHeading } from "@workspace/ui/components/page-heading";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { CANDIDATE_API_KEY, updateCandidate } from "@/lib/api/candidate";
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

export const CandidateDetailHeader = ({
  candidate,
}: CandidateDetailHeaderProps) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false);
  const [isAddToVacancyDialogOpen, setIsAddToVacancyDialogOpen] =
    useState(false);
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

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="brand-outline"
          className="flex items-center gap-2 w-full lg:w-fit bg-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Link
          href={`/candidates/${candidate.id}/edit`}
          className="w-full lg:w-fit"
        >
          <Button
            size="sm"
            variant="brand-outline"
            className="flex items-center gap-2 w-full lg:w-fit bg-white"
          >
            <Edit className="h-4 w-4" />
            Editar candidato
          </Button>
        </Link>
        <Button
          size="sm"
          variant="brand-outline"
          className="flex items-center gap-2 w-full lg:w-fit bg-white"
          onClick={() => setIsAddToVacancyDialogOpen(true)}
        >
          <Briefcase className="h-4 w-4" />
          Agregar a vacante
        </Button>
        {!candidate.blacklist ? (
          <Button
            variant="brand-outline"
            size="sm"
            className="flex items-center gap-2 text-amber-600 hover:border-amber-400 hover:bg-amber-50 w-full lg:w-fit bg-white"
            onClick={() => setIsBlacklistDialogOpen(true)}
          >
            <AlertTriangle className="h-4 w-4" />
            Añadir a blacklist
          </Button>
        ) : (
          <Button
            variant="brand-outline"
            size="sm"
            className="flex items-center gap-2 text-amber-600 hover:border-amber-400 hover:bg-amber-50 w-full lg:w-fit bg-white"
          >
            <ClipboardList className="h-4 w-4" />
            Eliminar de blacklist
          </Button>
        )}
        <PermissionGuard permissions={[PermissionCode.CANDIDATE_MANAGE]}>
          <Button
            variant="brand-outline"
            size="sm"
            className="flex items-center gap-2 text-red-600 hover:border-red-400 hover:bg-red-50 w-full lg:w-fit bg-white"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4" />
            Eliminar candidato
          </Button>
        </PermissionGuard>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-brand-border bg-surface p-6 lg:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo */}
          <div className="relative w-full lg:w-1/6 shrink-0">
            <div className="aspect-square overflow-hidden rounded-2xl border border-brand-border">
              <Image
                src={candidate.image || "/images/placeholder.svg"}
                alt={candidate.name}
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
            {candidate.blacklist && (
              <Badge
                variant="destructive"
                className="absolute top-2 right-2 rounded-lg"
              >
                Blacklist
              </Badge>
            )}
            {Boolean(candidate.isInCompanyViaPratt && !candidate.blacklist) && (
              <Badge
                variant="secondary"
                className="absolute text-white top-2 right-2 bg-emerald-500/90 rounded-lg"
              >
                via Pratt
              </Badge>
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 space-y-3 w-full lg:w-1/2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  {candidate.name}
                </h2>
                {candidate.linkedin && (
                  <Link
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:scale-110 transition-transform ease-[cubic-bezier(0.16,1,0.3,1)]"
                  >
                    <Image
                      src="/images/linkedin.svg"
                      alt="LinkedIn"
                      width={24}
                      height={24}
                      className="inline-block"
                    />
                  </Link>
                )}
              </div>
              {candidate.shortDescription && (
                <p className="text-sm text-slate-brand leading-relaxed">
                  {candidate.shortDescription}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-brand">
                {candidate.countries && candidate.countries.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{candidate.countries.map((c) => c).join(", ")}</span>
                  </div>
                )}
                {candidate.dateOfBirth && (
                  <span>{calculateAge(candidate.dateOfBirth)} años</span>
                )}
              </div>
              {candidate.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-brand" />
                  <a
                    className="hover:underline text-electric"
                    href={`mailto:${candidate.email}`}
                  >
                    {candidate.email}
                  </a>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-brand">
                  <Phone className="h-3 w-3 text-muted-brand" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              <Separator className="!my-4 w-[300px] bg-brand-border" />
              <div className="flex flex-col gap-4">
                {candidate.languages && candidate.languages.length > 0 && (
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-xs text-muted-brand block w-1/5 lg:w-[10%]">
                      Idiomas
                    </span>
                    <div className="flex flex-wrap gap-1 w-4/5 lg:w-[90%]">
                      {candidate.languages.map((language) => (
                        <Badge
                          key={language}
                          variant="outline"
                          className="text-xs h-5 rounded-lg border-brand-border text-slate-brand"
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {candidate.provinces && candidate.provinces.length > 0 && (
                  <div className="text-sm flex items-center gap-2">
                    <span className="text-xs text-muted-brand block w-1/5 lg:w-[10%]">
                      Provincias
                    </span>
                    <div className="flex flex-wrap gap-1 w-4/5 lg:w-[90%]">
                      {candidate.provinces.map((province) => (
                        <Badge
                          key={province}
                          variant="outline"
                          className="text-xs h-5 rounded-lg border-brand-border text-slate-brand"
                        >
                          {province}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="flex flex-col gap-4 text-sm w-full lg:w-1/3">
            {candidate.seniorities && candidate.seniorities.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-muted-brand text-xs w-1/5">Seniority</div>
                <div className="flex flex-wrap gap-1 mt-1 w-4/5">
                  {candidate.seniorities.map((seniority) => (
                    <Badge
                      key={seniority.id}
                      variant="outline"
                      className="text-xs rounded-lg border-brand-border bg-electric/5 text-electric"
                    >
                      {seniority.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {candidate.areas && candidate.areas.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-muted-brand text-xs w-1/5">Áreas</div>
                <div className="flex flex-wrap gap-1 mt-1 w-4/5">
                  {candidate.areas.map((area) => (
                    <Badge
                      key={area.id}
                      variant="outline"
                      className="text-xs rounded-lg border-brand-border bg-electric/5 text-electric"
                    >
                      {area.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {candidate.industries && candidate.industries.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-muted-brand text-xs w-1/5">Industrias</div>
                <div className="flex flex-wrap gap-1 mt-1 w-4/5">
                  {candidate.industries.map((industry) => (
                    <Badge
                      key={industry.id}
                      variant="outline"
                      className="text-xs rounded-lg border-brand-border bg-electric/5 text-electric"
                    >
                      {industry.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {candidate.source && (
              <div className="flex items-center gap-2">
                <div className="text-muted-brand text-xs w-1/5">Fuente</div>
                <div className="flex flex-wrap gap-1 mt-1 w-4/5">
                  <Badge
                    variant="outline"
                    className="text-xs rounded-lg border-brand-border text-slate-brand"
                  >
                    {candidate.source.name}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="text-muted-brand text-xs w-1/5">Calificación</div>
              <div className="flex items-center gap-4 w-4/5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-electric/5 hover:text-electric transition-colors"
                  onClick={decrementStars}
                  disabled={stars <= 0}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>

                <CandidateStars stars={stars} />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-electric/5 hover:text-electric transition-colors"
                  onClick={incrementStars}
                  disabled={stars >= 5}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
};
