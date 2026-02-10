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

import { NewOrganizationForm } from "./new-organization-form";

export function NewOrganizationSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nueva organización
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nueva organización</SheetTitle>
          <SheetDescription>
            Complete el formulario para crear una nueva organización.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          {isOpen && (
            <NewOrganizationForm onSuccess={() => setIsOpen(false)} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
