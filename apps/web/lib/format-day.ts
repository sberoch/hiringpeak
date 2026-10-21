import dayjs from "dayjs";

import "dayjs/locale/es";

dayjs.locale("es");

/** A day (`YYYY-MM-DD` or an ISO timestamp) → "15 oct 2026". */
export function formatDay(day: string | Date): string {
  return dayjs(day).format("D MMM YYYY");
}
