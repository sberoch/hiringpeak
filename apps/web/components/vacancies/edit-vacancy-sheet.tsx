"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@workspace/ui/components/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Textarea } from "@workspace/ui/components/textarea";
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import { updateVacancy, VACANCY_API_KEY } from "@/lib/api/vacancy";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { vacancyDisplayLabel } from "@/lib/utils";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { User } from "@workspace/shared/types/user";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import {
  EditVacancyFormSchema,
  editVacancyFormSchema,
  EditVacancySchema,
} from "./edit-vacancy.schema";

interface EditVacancySheetProps {
  vacancy: Vacancy;
  isOpen: boolean;
  onClose: () => void;
}

function transformFormUpdate(
  form: EditVacancyFormSchema,
  originalVacancy: Vacancy
): EditVacancySchema {
  const areas =
    !form.filters?.areas?.map((a) => a.id).length &&
      originalVacancy.filters?.areas?.length
      ? null
      : form.filters?.areas?.map((a) => a.id);

  const industries =
    !form.filters?.industries?.map((a) => a.id).length &&
      originalVacancy.filters?.industries?.length
      ? null
      : form.filters?.industries?.map((a) => a.id);

  const seniorities =
    !form.filters?.seniorities?.map((a) => a.id).length &&
      originalVacancy.filters?.seniorities?.length
      ? null
      : form.filters?.seniorities?.map((a) => a.id);

  return {
    createdBy: form.createdBy.id,
    assignedTo: form.assignedTo.id,
    companyId: form.company.id,
    statusId: form.status.id,
    title: form.title,
    description: form.description,
    salary: form.salary || null,
    filters: {
      gender: form.filters?.gender,
      maxAge: form.filters?.maxAge,
      minAge: form.filters?.minAge,
      minStars: form.filters?.minStars,
      areaIds: areas,
      industryIds: industries,
      seniorityIds: seniorities,
    },
  };
}

export function EditVacancySheet({
  vacancy,
  isOpen,
  onClose,
}: EditVacancySheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const { data: vacancyStatuses } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1e9, page: 1 }),
  });

  const { data: companies } = useQuery({
    queryKey: [
      COMPANIES_API_KEY,
      { limit: 1e9, page: 1, status: CompanyStatusEnum.ACTIVE },
    ],
    queryFn: () =>
      getAllCompanies({
        limit: 1e9,
        page: 1,
        status: CompanyStatusEnum.ACTIVE,
      }),
  });

  const { data: seniorities } = useQuery({
    queryKey: [SENIORITY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllSeniorities({ limit: 1e9, page: 1 }),
  });

  const { data: areas } = useQuery({
    queryKey: [AREAS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllAreas({ limit: 1e9, page: 1 }),
  });

  const { data: industries } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllIndustries({ limit: 1e9, page: 1 }),
  });

  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
  });

  const { mutate: updateVacancyMutation, isPending } = useMutation({
    mutationFn: (values: EditVacancySchema) =>
      updateVacancy(vacancy.id.toString(), values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      toast.success("Vacante actualizada exitosamente");
      if (shouldNavigate) {
        router.push(`/vacancies/${vacancy.id}/candidate-selection`);
        setShouldNavigate(false);
      }
      onClose();
    },
    onError: () => {
      toast.error("Error al actualizar la vacante");
      setShouldNavigate(false);
    },
  });

  const form = useForm<EditVacancyFormSchema>({
    resolver: zodResolver(editVacancyFormSchema),
    defaultValues: {
      title: vacancy.title,
      description: vacancy.description || "",
      salary: vacancy.salary || "",
      status: vacancy.status,
      company: vacancy.company,
      assignedTo: vacancy.assignedTo,
      createdBy: vacancy.createdBy,
      filters: {
        minStars: vacancy.filters?.minStars,
        gender: vacancy.filters?.gender || "none",
        minAge: vacancy.filters?.minAge,
        maxAge: vacancy.filters?.maxAge,
        areas: vacancy.filters?.areas,
        industries: vacancy.filters?.industries,
        seniorities: vacancy.filters?.seniorities,
      },
    },
  });

  function onSubmit(values: EditVacancyFormSchema) {
    updateVacancyMutation(transformFormUpdate(values, vacancy));
  }

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-[90%] sm:w-auto sm:max-w-3xl overflow-y-auto bg-surface border-brand-border">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-ink">Editar vacante</SheetTitle>
          <SheetDescription className="text-slate-brand">
            Modifique los datos de la vacante {vacancyDisplayLabel(vacancy)}.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información básica</CardTitle>
                  <CardDescription>
                    Completa la información básica de la vacante.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Título de la vacante"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción de la vacante"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compensación</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="$10,000,000"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(
                                vacancyStatuses?.items.find(
                                  (vs) => vs.name === value
                                )
                              );
                            }}
                            defaultValue={field.value?.name.toString()}
                            value={field.value?.name.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vacancyStatuses?.items?.map((status) => (
                                <SelectItem key={status.id} value={status.name}>
                                  {status.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(
                                companies?.items.find((c) => c.name === value)
                              )
                            }
                            defaultValue={field.value?.name.toString()}
                            value={field.value?.name.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una empresa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies?.items?.map((company) => (
                                <SelectItem
                                  key={company.id}
                                  value={company.name}
                                >
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="createdBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Generación</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(
                                users?.items.find((u) => u.id.toString() === value)
                              )
                            }
                            defaultValue={field.value?.id.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un responsable" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users?.items.map((user: User) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {user.name ?? user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ejecución</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(
                                users?.items.find((u) => u.id.toString() === value)
                              )
                            }
                            defaultValue={field.value?.id.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un responsable" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users?.items.map((user: User) => (
                                <SelectItem
                                  key={user.id}
                                  value={user.id.toString()}
                                >
                                  {user.name ?? user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Filtros de búsqueda</CardTitle>
                  <CardDescription>
                    Define los filtros para encontrar candidatos adecuados (
                    <b>todos los campos son opcionales</b>).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="filters.seniorities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seniority</FormLabel>
                          <FormControl>
                            <MultiSelector
                              values={field.value?.map((s) => s.name) || []}
                              onValuesChange={(values) => {
                                const localSeniorities = values
                                  .map(
                                    (v) =>
                                      seniorities?.items.find(
                                        (_area) => _area.name === v
                                      ) || null
                                  )
                                  .filter((a) => !!a);
                                field.onChange(localSeniorities);
                              }}
                            >
                              <MultiSelectorTrigger>
                                <MultiSelectorInput placeholder="Seleccione seniorities" />
                              </MultiSelectorTrigger>
                              <MultiSelectorContent>
                                <MultiSelectorList className="bg-white">
                                  {seniorities?.items.map((seniority) => (
                                    <MultiSelectorItem
                                      key={seniority.id}
                                      value={seniority.name}
                                    >
                                      {seniority.name}
                                    </MultiSelectorItem>
                                  ))}
                                </MultiSelectorList>
                              </MultiSelectorContent>
                            </MultiSelector>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filters.areas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Áreas</FormLabel>
                          <FormControl>
                            <MultiSelector
                              values={field.value?.map((a) => a.name) || []}
                              onValuesChange={(values) => {
                                const localAreas = values
                                  .map(
                                    (v) =>
                                      areas?.items.find(
                                        (_area) => _area.name === v
                                      ) || null
                                  )
                                  .filter((a) => !!a);
                                field.onChange(localAreas);
                              }}
                            >
                              <MultiSelectorTrigger>
                                <MultiSelectorInput placeholder="Seleccione áreas" />
                              </MultiSelectorTrigger>
                              <MultiSelectorContent>
                                <MultiSelectorList className="bg-white">
                                  {areas?.items.map((area) => (
                                    <MultiSelectorItem
                                      key={area.id}
                                      value={area.name}
                                    >
                                      {area.name}
                                    </MultiSelectorItem>
                                  ))}
                                </MultiSelectorList>
                              </MultiSelectorContent>
                            </MultiSelector>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filters.industries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industrias</FormLabel>
                          <FormControl>
                            <MultiSelector
                              values={field.value?.map((i) => i.name) || []}
                              onValuesChange={(values) => {
                                const inds = values
                                  .map(
                                    (v) =>
                                      industries?.items.find(
                                        (_area) => _area.name === v
                                      ) || null
                                  )
                                  .filter((a) => !!a);

                                field.onChange(inds);
                              }}
                            >
                              <MultiSelectorTrigger>
                                <MultiSelectorInput placeholder="Seleccione industrias" />
                              </MultiSelectorTrigger>
                              <MultiSelectorContent>
                                <MultiSelectorList className="bg-white">
                                  {industries?.items.map((industry) => (
                                    <MultiSelectorItem
                                      key={industry.id}
                                      value={industry.name}
                                    >
                                      {industry.name}
                                    </MultiSelectorItem>
                                  ))}
                                </MultiSelectorList>
                              </MultiSelectorContent>
                            </MultiSelector>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="filters.minStars"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Calificación mínima</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="5"
                              step="0.5"
                              placeholder="Ej: 3.5"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filters.gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un género" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">
                                Sin preferencia
                              </SelectItem>
                              <SelectItem value="Masculino">
                                Masculino
                              </SelectItem>
                              <SelectItem value="Femenino">Femenino</SelectItem>
                              <SelectItem value="Other">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="filters.minAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Edad mínima</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="18"
                              placeholder="Ej: 25"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="filters.maxAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Edad máxima</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="18"
                              placeholder="Ej: 45"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <SheetFooter className="gap-2 lg:gap-0">
                <Button type="submit" variant="outline" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar y salir"}
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setShouldNavigate(true);
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  {isPending
                    ? "Guardando..."
                    : "Guardar y continuar con postulantes"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
