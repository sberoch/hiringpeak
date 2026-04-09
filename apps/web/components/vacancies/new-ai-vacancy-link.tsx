"use client";

import Link from "next/link";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@workspace/ui/components/button";

const VACANCY_MANAGE = "VACANCY_MANAGE";

export function NewAiVacancyLink() {
  return (
    <PermissionGuard permissions={[VACANCY_MANAGE]}>
      <Button asChild variant="outline" className="rounded-md">
        <Link href="/vacancies/new-ai">Crear con IA</Link>
      </Button>
    </PermissionGuard>
  );
}

