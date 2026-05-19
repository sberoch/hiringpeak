import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type WizardStep = 1 | 2 | 3;

const STEPS: { number: WizardStep; label: string }[] = [
  { number: 1, label: "Información básica" },
  { number: 2, label: "Perfil buscado" },
  { number: 3, label: "Selección de postulantes" },
];

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
}

export function WizardStepIndicator({ currentStep }: WizardStepIndicatorProps) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-start gap-x-3 sm:gap-x-6 w-full px-2">
      {STEPS.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;
        const isLast = index === STEPS.length - 1;

        return (
          <Step
            key={step.number}
            step={step}
            isActive={isActive}
            isCompleted={isCompleted}
            renderLine={!isLast}
            lineFilled={step.number < currentStep}
          />
        );
      })}
    </div>
  );
}

function Step({
  step,
  isActive,
  isCompleted,
  renderLine,
  lineFilled,
}: {
  step: { number: WizardStep; label: string };
  isActive: boolean;
  isCompleted: boolean;
  renderLine: boolean;
  lineFilled: boolean;
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-2 w-[110px]">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
            isCompleted && "border-electric bg-electric text-white",
            isActive &&
              "border-electric bg-surface text-ink ring-4 ring-electric/15",
            !isActive &&
              !isCompleted &&
              "border-brand-border bg-surface text-muted-brand",
          )}
        >
          {isCompleted ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : (
            step.number
          )}
        </div>
        <span
          className={cn(
            "text-xs text-center leading-tight",
            isActive && "text-ink font-semibold",
            isCompleted && "text-ink font-medium",
            !isActive && !isCompleted && "text-muted-brand",
          )}
        >
          {step.label}
        </span>
      </div>
      {renderLine && (
        <div
          className={cn(
            "h-[2px] mt-[18px] rounded-full transition-colors",
            lineFilled ? "bg-electric" : "bg-brand-border",
          )}
        />
      )}
    </>
  );
}
