"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SimulateVacancyDialog } from "@/components/vacancies/simulate-vacancy/simulate-vacancy-dialog";
import { DialogsIdsEnum } from "@/lib/consts";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const dialogComponents = {
  [DialogsIdsEnum.simulateVacancy]: SimulateVacancyDialog,
};

const isValidDialogKey = (
  key: string
): key is keyof typeof dialogComponents => {
  return key in dialogComponents;
};

export function SidebarDialogs() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const router = useRouter();

  const DialogComponent = useMemo(() => {
    if (action && isValidDialogKey(action)) {
      return dialogComponents[action];
    }
    return null;
  }, [action]);

  const dialogProps: DialogProps = {
    isOpen: true,
    onClose: () => router.push("?"),
  };

  return <>{DialogComponent ? <DialogComponent {...dialogProps} /> : null}</>;
}
