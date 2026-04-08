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

import { UserForm } from "./user-form";

export function NewUserSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="bg-electric hover:bg-electric-light text-white rounded-md px-5 py-2 font-semibold shadow-none hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] transition-all cursor-pointer">
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-md bg-surface border-brand-border">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-ink">Nuevo usuario</SheetTitle>
          <SheetDescription className="text-slate-brand">
            Complete el formulario para crear un nuevo usuario.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          {isOpen && <UserForm onSubmit={() => setIsOpen(false)} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
