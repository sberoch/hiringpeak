export interface Dashboard {
  activeCandidates: number;
  activeVacancies: number;
  monthlyCandidates: number;
  monthlyVacancies: number;
  avgDaysOpen: number | null;
}

export interface RecruiterStats {
  userId: number;
  name: string;
  activeVacancies: number;
  totalVacancies: number;
  fillRate: number | null;
  candidatesInPipeline: number;
  avgTimeToFillDays: number | null;
}

/** One Opportunity Owner's row in «Rendimiento comercial por responsable». */
export interface CommercialOwnerStats {
  ownerId: number;
  name: string;
  /** Open Opportunities, regardless of when they were created. */
  open: number;
  /** Sum of open Estimated Fees; Opportunities without a fee are ignored. */
  openFee: number;
  /** Won with a Close Date in the current calendar year. */
  won: number;
  wonFee: number;
  /** won ÷ (won + lost) by count, as a 0-100 integer; null when none closed this year. */
  closeRate: number | null;
}

/** «Comercial» Dashboard section, always for the current calendar year. */
export interface CommercialSummary {
  open: number;
  /** Opportunities created this calendar month ("+N este mes"). */
  createdThisMonth: number;
  openFee: number;
  wonThisYear: number;
  wonFeeThisYear: number;
  owners: CommercialOwnerStats[];
}
