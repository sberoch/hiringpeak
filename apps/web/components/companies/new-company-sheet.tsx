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
        <Button>
          <Plus className="h-4 w-4" />
          Nueva empresa
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nueva empresa</SheetTitle>
          <SheetDescription>
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
