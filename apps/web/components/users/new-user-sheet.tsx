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
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nuevo usuario</SheetTitle>
          <SheetDescription>
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
