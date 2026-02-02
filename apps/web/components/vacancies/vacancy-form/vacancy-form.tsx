"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import { createVacancy, VACANCY_API_KEY } from "@/lib/api/vacancy";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { User } from "@workspace/shared/types/user";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import {
  CreateVacancyFormSchema,
  createVacancyFormSchema,
  CreateVacancySchema,
} from "../new-vacancy.schema";
import countries from "@/public/assets/countries.json";
import languages from "@/public/assets/languages.json";
import provinces from "@/public/assets/provinces.json";

function VacancyFormSkeleton() {
  return (
    <div className="space-y-6 w-full">
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 w-full bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

interface VacancyFormProps {
  afterSubmit: (values: Vacancy) => void;
  defaultValues?: Partial<CreateVacancyFormSchema>;
  submitLabel?: string;
}

function transformCreateForm(
  values: CreateVacancyFormSchema
): CreateVacancySchema {
  return {
    assignedTo: values.assignedTo,
    companyId: parseInt(values.company),
    createdBy: values.createdBy,
    statusId: parseInt(values.status),
    title: values.title,
    description: values.description,
    filters: {
      areaIds: values.filters?.areas?.map((a) => a.id) || [],
      industryIds: values.filters?.industries?.map((i) => i.id) || [],
      seniorityIds: values.filters?.seniorities?.map((s) => s.id) || [],
      gender: values.filters?.gender,
      minAge: values.filters?.minAge,
      maxAge: values.filters?.maxAge,
      minStars: values.filters?.minStars,
      countries: values.filters?.countries,
      provinces: values.filters?.provinces,
      languages: values.filters?.languages,
    },
  };
}

export function VacancyForm({
  afterSubmit,
  defaultValues = {
    title: "",
    description: "",
    status: undefined,
    company: undefined,
    filters: {
      seniorities: [],
      areas: [],
      industries: [],
      minStars: undefined,
      gender: "none",
      minAge: undefined,
      maxAge: undefined,
    },
    assignedTo: undefined,
  },
  submitLabel = "Crear vacante",
}: VacancyFormProps) {
  const session = useSession();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
  });

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

  const { mutate: createVacancyMutation, isPending } = useMutation({
    mutationFn: (values: CreateVacancySchema) => createVacancy(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });
      toast.success("Vacante actualizada exitosamente");
      if (afterSubmit) afterSubmit(data);
    },
    onError: () => {
      toast.error("Error al actualizar la vacante");
    },
  });

  const form = useForm<CreateVacancyFormSchema>({
    resolver: zodResolver(createVacancyFormSchema),
    defaultValues,
  });

  const selectedCountriesRaw = form.watch("filters.countries");
  const selectedCountries =
    selectedCountriesRaw && selectedCountriesRaw.length > 0
      ? selectedCountriesRaw
      : ["Argentina"];
  const availableProvinces = provinces
    .filter((p) => selectedCountries?.includes(p.country) ?? false)
    .flatMap((p) => p.provinces);

  function handleSubmit(values: CreateVacancyFormSchema) {
    createVacancyMutation(transformCreateForm(values));
  }

  useEffect(() => {
    console.log("session.data", session.data);
    if (!session.data?.userId) return;
    if (!form.formState.dirtyFields.createdBy) {
      form.setValue("createdBy", parseInt(session.data?.userId));
    }
    if (!form.formState.dirtyFields.assignedTo) {
      form.setValue("assignedTo", parseInt(session.data?.userId));
    }
  }, [session.status, session.data?.userId, form]);

  if (session.status !== "authenticated" || !data) {
    return <VacancyFormSkeleton />;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 w-full"
      >
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
                    <Input placeholder="Título de la vacante" {...field} />
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
                      className="min-h-[80px]"
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vacancyStatuses?.items.map((status) => (
                          <SelectItem
                            key={status.id}
                            value={status.id.toString()}
                          >
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies?.items.map((company) => (
                          <SelectItem
                            key={company.id}
                            value={company.id.toString()}
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
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {data?.items.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
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
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un responsable" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {data?.items.map((user: User) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
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
                          const selected = values
                            .map(
                              (name) =>
                                seniorities?.items.find(
                                  (s) => s.name === name
                                ) || null
                            )
                            .filter((a) => !!a);
                          field.onChange(selected);
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
                                className="bg-white my-1"
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
                        values={field?.value?.map((f) => f.name) || []}
                        onValuesChange={(values) => {
                          const selected = values
                            .map(
                              (name) =>
                                areas?.items.find((a) => a.name === name) ||
                                null
                            )
                            .filter((a) => !!a);
                          field.onChange(selected);
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
                                className="bg-white my-1"
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
                        values={field.value?.map((v) => v.name) || []}
                        onValuesChange={(values) => {
                          const selectedIds = values
                            .map(
                              (name) =>
                                industries?.items.find(
                                  (i) => i.name === name
                                ) || null
                            )
                            .filter((a) => !!a);
                          field.onChange(selectedIds);
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
                                className="bg-white my-1"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="filters.countries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País(es)</FormLabel>
                    <FormControl>
                      <MultiSelector
                        values={field.value ?? []}
                        onValuesChange={field.onChange}
                      >
                        <MultiSelectorTrigger>
                          <MultiSelectorInput placeholder="Seleccione países" />
                        </MultiSelectorTrigger>
                        <MultiSelectorContent>
                          <MultiSelectorList className="bg-white">
                            {countries.map((country) => (
                              <MultiSelectorItem
                                key={country.name}
                                value={country.name}
                                className="bg-white my-1"
                              >
                                {country.name}
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
                name="filters.provinces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia(s)</FormLabel>
                    <FormControl>
                      <MultiSelector
                        values={field.value ?? []}
                        onValuesChange={field.onChange}
                      >
                        <MultiSelectorTrigger>
                          <MultiSelectorInput placeholder="Seleccione provincias" />
                        </MultiSelectorTrigger>
                        <MultiSelectorContent>
                          <MultiSelectorList className="bg-white">
                            {availableProvinces.map((province) => (
                              <MultiSelectorItem
                                key={province}
                                value={province}
                                className="bg-white my-1"
                              >
                                {province}
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
                name="filters.languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma(s)</FormLabel>
                    <FormControl>
                      <MultiSelector
                        values={field.value ?? []}
                        onValuesChange={field.onChange}
                      >
                        <MultiSelectorTrigger>
                          <MultiSelectorInput placeholder="Seleccione idiomas" />
                        </MultiSelectorTrigger>
                        <MultiSelectorContent>
                          <MultiSelectorList className="bg-white">
                            {languages.map((language) => (
                              <MultiSelectorItem
                                key={language.name}
                                value={language.name}
                                className="bg-white my-1"
                              >
                                {language.name}
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
                        <SelectItem value="none">Sin preferencia</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Femenino</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
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

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
