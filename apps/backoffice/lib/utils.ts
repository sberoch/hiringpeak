import type { AuthTokenData } from "@workspace/shared/types/auth";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJwt(token: string): AuthTokenData {
  return JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  ) as AuthTokenData;
}

type FilterRecord = Record<
  string,
  string | number | boolean | undefined | Array<string | number | boolean> | null
>;

export function filtersToSearchParams(filters: FilterRecord): string {
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, item.toString());
        }
      });
    } else {
      searchParams.append(key, value.toString());
    }
  });
  if (searchParams.toString() === "") return "";
  return `?${searchParams.toString()}`;
}
