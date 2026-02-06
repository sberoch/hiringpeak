import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { updateUser, USERS_API_KEY } from "@/lib/api/user";
import { ROLES_NAMES, User, UserRoleEnum } from "@workspace/shared/types/user";

import { editUserFormSchema, type EditUserFormSchema } from "./edit-user.schema";

interface EditUserSheetProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserSheet({ user, isOpen, onClose }: EditUserSheetProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditUserFormSchema>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: EditUserFormSchema) =>
      updateUser(user.id.toString(), values),
    onSuccess: () => {
      toast.success("Usuario actualizado exitosamente");
      queryClient
        .invalidateQueries({ queryKey: [USERS_API_KEY] })
        .then(onClose);
    },
  });

  function onSubmit(values: EditUserFormSchema) {
    mutateAsync(values);
  }

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar usuario</SheetTitle>
          <SheetDescription>
            Modifique los datos del usuario {user.name}.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Contraseña (dejar en blanco para mantener la actual)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nueva contraseña (opcional)"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(UserRoleEnum).map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLES_NAMES[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <SheetFooter className="pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
