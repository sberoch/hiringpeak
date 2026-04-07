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
