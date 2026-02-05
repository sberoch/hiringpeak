"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  RotateCcw,
  Search,
} from "lucide-react";
import { useState } from "react";

import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { cn } from "@/lib/utils";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { VacancyFiltersType } from "@workspace/shared/types/vacancy";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface VacancyFiltersProps {
  filters: VacancyFiltersType;
  onFiltersChange: (filters: VacancyFiltersType) => void;
  resetFilters: () => void;
}

export function VacancyFilters({
  filters,
  onFiltersChange,
  resetFilters,
}: VacancyFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: statuses } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1e9, page: 1 }),
  });

  const { data: seniorities } = useQuery({
    queryKey: [SENIORITY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllSeniorities({ limit: 1e9, page: 1 }),
  });

  const { data: industries } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllIndustries({ limit: 1e9, page: 1 }),
  });

  const { data: areas } = useQuery({
    queryKey: [AREAS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllAreas({ limit: 1e9, page: 1 }),
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

  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
  });

  return (
    <Card className={cn(isCollapsed && "gap-0")}>
      <CardHeader className={cn("pb-0 gap-0 relative flex flex-row items-center w-full justify-between", !isCollapsed && "pt-4 px-4")}>
        <CardTitle className="text-lg font-medium">
          <span className="mr-2">🔍</span> Filtros y Búsqueda
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className=""
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {!isCollapsed ? (
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Buscar por nombre o número..."
                  className="pl-8"
                  value={filters.title}
                  onChange={(event) =>
                    onFiltersChange({
                      ...filters,
                      title: event.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Select

                value={filters.status?.name ?? ""}
                onValueChange={(status) =>
                  onFiltersChange({
                    ...filters,
                    status: statuses?.items.find((f) => f.name === status),
                  })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {statuses?.items.map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal px-3",
                      !filters.seniorities?.length && "text-muted-foreground"
                    )}
                  >
                    {filters.seniorities?.length
                      ? `${filters.seniorities.length} seniorities seleccionadas`
                      : "Seleccionar seniorities"}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="min-w-full p-0 lg:w-[460px]">
                  <Command>
                    <CommandInput
                      placeholder="Buscar seniority..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        No se ha encontrado la seniority.
                      </CommandEmpty>
                      <CommandGroup>
                        {seniorities?.items.map((seniority) => (
                          <CommandItem
                            key={seniority.id}
                            value={seniority.name}
                            onSelect={() => {
                              const currentSeniorities =
                                filters.seniorities || [];
                              const exists = currentSeniorities.some(
                                (s) => s.id === seniority.id
                              );
                              onFiltersChange({
                                ...filters,
                                seniorities: exists
                                  ? currentSeniorities.filter(
                                    (s) => s.id !== seniority.id
                                  )
                                  : [...currentSeniorities, seniority],
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.seniorities?.some(
                                  (s) => s.id === seniority.id
                                )
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {seniority.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal px-3",
                      !filters.industries?.length && "text-muted-foreground"
                    )}
                  >
                    {filters.industries?.length
                      ? `${filters.industries.length} industrias seleccionadas`
                      : "Seleccionar industrias"}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="min-w-full p-0 lg:w-[460px]">
                  <Command>
                    <CommandInput
                      placeholder="Buscar industria..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        No se ha encontrado la industria.
                      </CommandEmpty>
                      <CommandGroup>
                        {industries?.items.map((industry) => (
                          <CommandItem
                            key={industry.id}
                            value={industry.name}
                            onSelect={() => {
                              const currentIndustries =
                                filters.industries || [];
                              const exists = currentIndustries.some(
                                (i) => i.id === industry.id
                              );
                              onFiltersChange({
                                ...filters,
                                industries: exists
                                  ? currentIndustries.filter(
                                    (i) => i.id !== industry.id
                                  )
                                  : [...currentIndustries, industry],
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.industries?.some(
                                  (i) => i.id === industry.id
                                )
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {industry.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between font-normal px-3",
                      !filters.areas?.length && "text-muted-foreground"
                    )}
                  >
                    {filters.areas?.length
                      ? `${filters.areas.length} áreas seleccionadas`
                      : "Seleccionar áreas"}
                    <ChevronsUpDown className="opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="min-w-full p-0 lg:w-[460px]">
                  <Command>
                    <CommandInput
                      placeholder="Buscar área..."
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>No se ha encontrado el área.</CommandEmpty>
                      <CommandGroup>
                        {areas?.items.map((area) => (
                          <CommandItem
                            key={area.id}
                            value={area.name}
                            onSelect={() => {
                              const currentAreas = filters.areas || [];
                              const exists = currentAreas.some(
                                (a) => a.id === area.id
                              );
                              onFiltersChange({
                                ...filters,
                                areas: exists
                                  ? currentAreas.filter((a) => a.id !== area.id)
                                  : [...currentAreas, area],
                              });
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.areas?.some((a) => a.id === area.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {area.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Select
                value={filters.company?.id?.toString() ?? ""}
                onValueChange={(companyId) =>
                  onFiltersChange({
                    ...filters,
                    company: companies?.items.find(
                      (c) => c.id.toString() === companyId
                    ),
                  })
                }
              >
                <SelectTrigger id="company">
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.items.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={filters.createdBy?.toString() ?? ""}
                onValueChange={(userId) =>
                  onFiltersChange({
                    ...filters,
                    createdBy: parseInt(userId),
                  })
                }
              >
                <SelectTrigger id="createdBy">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users?.items.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={filters.assignedTo?.toString() ?? ""}
                onValueChange={(userId) =>
                  onFiltersChange({
                    ...filters,
                    assignedTo: parseInt(userId),
                  })
                }
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Seleccionar usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users?.items.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 col-start-3 ml-auto mt-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="flex items-center"
              >
                <RotateCcw className="h-4 w-4" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      ) : (
        <div className="p-0" />
      )}
    </Card>
  );
}
