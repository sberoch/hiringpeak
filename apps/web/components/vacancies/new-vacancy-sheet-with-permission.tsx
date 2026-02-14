"use client";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { NewVacancySheet } from "./new-vacancy-sheet";

const VACANCY_MANAGE = "VACANCY_MANAGE";

export function NewVacancySheetWithPermission() {
  return (
    <PermissionGuard permissions={[VACANCY_MANAGE]}>
      <NewVacancySheet />
    </PermissionGuard>
  );
}
