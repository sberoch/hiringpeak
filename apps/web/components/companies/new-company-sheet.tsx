"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";

import { CompanyForm } from "./company-form";

export function NewCompanySheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="bg-electric hover:bg-electric-light text-white rounded-md px-5 py-2 font-semibold shadow-none hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all cursor-pointer">
          <Plus className="h-4 w-4" />
          Nueva empresa
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-xl overflow-y-auto bg-surface border-brand-border">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-ink">Nueva empresa</SheetTitle>
          <SheetDescription className="text-slate-brand">
            Complete el formulario para crear una nueva empresa.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <CompanyForm onSubmit={() => setIsOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
