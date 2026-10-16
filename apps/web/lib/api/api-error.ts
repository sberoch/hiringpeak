/** Axios error message from the API, else the fallback. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  return typeof message === "string" ? message : fallback;
}
