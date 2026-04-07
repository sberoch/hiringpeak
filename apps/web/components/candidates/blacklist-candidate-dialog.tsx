"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Textarea } from "@workspace/ui/components/textarea";
import type { Candidate } from "@workspace/shared/types/candidate";
import { blacklistCandidate } from "@/lib/api/candidate";

import {
  blacklistCandidateSchema,
  type BlacklistCandidateSchema,
} from "./blacklist-candidate.schema";

interface BlacklistCandidateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
}

export function BlacklistCandidateDialog({
  isOpen,
  onClose,
  candidate,
}: BlacklistCandidateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BlacklistCandidateSchema>({
    resolver: zodResolver(blacklistCandidateSchema),
    defaultValues: {
      reason: "",
    },
  });

  const handleSubmit = async (values: BlacklistCandidateSchema) => {
    setIsLoading(true);

    try {
      await blacklistCandidate(candidate.id, values.reason);
      toast.success("Candidato blacklisteado exitosamente");
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error blacklisting candidate:", error);
      toast.error("Error al blacklistear candidato");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl border-brand-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-ink">Añadir a Blacklist</DialogTitle>
          <DialogDescription className="text-slate-brand">
            Esto enviará a <span className="font-semibold text-ink">{candidate.name}</span>{" "}
            a la blacklist y no aparecerá en búsquedas regulares.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-ink font-medium">Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ingrese el motivo para añadir a este candidato a la blacklist"
                      {...field}
                      rows={4}
                      className="rounded-xl border-brand-border bg-canvas text-ink placeholder:text-muted-brand focus:border-electric focus:ring-electric/10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="brand-ghost"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 rounded-xl text-white"
              >
                {isLoading ? "Procesando..." : "Añadir a blacklist"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
