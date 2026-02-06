"use client";

import { useMemo, useState } from "react";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  INDUSTRIES_API_KEY,
  createIndustry,
  deleteIndustry,
  getAllIndustries,
  updateIndustry,
} from "@/lib/api/industry";
import type { Industry } from "@workspace/shared/types/industry";

export default function IndustriesSettings() {
  const queryClient = useQueryClient();

  const [newIndustry, setNewIndustry] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [industryToDelete, setIndustryToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllIndustries({ page: 1, limit: 1e9 }),
  });

  const filteredIndustries = useMemo(() => {
    return data?.items.filter((industry) =>
      industry.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const { mutate: handleAddIndustry } = useMutation({
    mutationFn: async (name: string) => {
      const industry = createIndustry({ name });
      setNewIndustry("");
      return industry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INDUSTRIES_API_KEY] }).then(() => {
        setNewIndustry("");
        setIsAddDialogOpen(false);
        toast.success("Industria creada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al crear la industria");
    },
  });

  const { mutate: handleEditIndustry } = useMutation({
    mutationFn: (industry: Industry) => updateIndustry(industry.id, { name: industry.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INDUSTRIES_API_KEY] }).then(() => {
        setEditingIndustry(null);
        toast.success("Industria actualizada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al actualizar la industria");
    },
  });

  const { mutate: handleDeleteIndustry } = useMutation({
    mutationFn: (id: Industry["id"]) => deleteIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INDUSTRIES_API_KEY] }).then(() => {
        setIndustryToDelete(null);
        toast.success("Industria eliminada correctamente");
      });
    },
    onError: () => {
      toast.error("Error al eliminar la industria");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-1/2">
          <Input
            placeholder="Buscar industrias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Industria
        </Button>
      </div>

      <div className="border rounded-md">
        {!data && isLoading ? (
          <div className="p-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIndustries?.map((industry) => (
                <TableRow key={industry.id}>
                  <TableCell>{industry.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingIndustry(industry)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIndustryToDelete(industry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {isAddDialogOpen && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Industria</DialogTitle>
              <DialogDescription>
                Ingresa el nombre de la nueva industria.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newIndustry}
                  onChange={(e) => setNewIndustry(e.target.value)}
                  placeholder="Nombre de la industria"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleAddIndustry(newIndustry)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!editingIndustry && (
        <Dialog open={!!editingIndustry} onOpenChange={() => setEditingIndustry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Industria</DialogTitle>
              <DialogDescription>
                Modifica el nombre de la industria.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingIndustry?.name || ""}
                  onChange={(e) =>
                    setEditingIndustry(
                      editingIndustry
                        ? { ...editingIndustry, name: e.target.value }
                        : null
                    )
                  }
                  placeholder="Nombre de la industria"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingIndustry(null)}
              >
                Cancelar
              </Button>
              <Button onClick={() => handleEditIndustry(editingIndustry!)} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!!industryToDelete && (
        <AlertDialog
          open={!!industryToDelete}
          onOpenChange={() => setIndustryToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente
                la industria y podría afectar a los postulantes que la tengan
                asignada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteIndustry(industryToDelete!)}
                disabled={isLoading}
              >
                {isLoading ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
