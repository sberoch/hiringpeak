import dayjs from "dayjs";

import "dayjs/locale/es";

dayjs.locale("es");

export const opportunityHref = (id: number) => `/opportunities/${id}`;

/** `YYYY-MM-DD` → "15 oct 2026". */
export function formatDay(isoDay: string): string {
  return dayjs(isoDay).format("D MMM YYYY");
}
