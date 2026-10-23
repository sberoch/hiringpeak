import { PermissionCode } from '@workspace/shared/enums';

/**
 * Every Permission's label and description, keyed by code so that a new
 * PermissionCode without an entry fails to compile. A new code still needs a
 * data migration to reach existing databases.
 */
const PERMISSIONS: Record<
  PermissionCode,
  { label: string; description: string }
> = {
  CANDIDATE_READ: {
    label: 'Ver postulantes',
    description: 'Permite ver listado y detalle de postulantes',
  },
  CANDIDATE_MANAGE: {
    label: 'Gestionar postulantes',
    description: 'Crear, editar y eliminar postulantes',
  },
  VACANCY_READ: {
    label: 'Ver vacantes',
    description: 'Permite ver listado y detalle de vacantes',
  },
  VACANCY_MANAGE: {
    label: 'Gestionar vacantes',
    description: 'Crear, editar y eliminar vacantes',
  },
  USER_READ: {
    label: 'Ver usuarios',
    description: 'Ver usuarios de la organización',
  },
  USER_MANAGE: {
    label: 'Gestionar usuarios',
    description: 'Crear y editar usuarios',
  },
  ROLE_MANAGE: {
    label: 'Gestionar roles',
    description: 'Crear y asignar roles y permisos',
  },
  COMPANY_READ: { label: 'Ver empresas', description: 'Ver empresas' },
  COMPANY_MANAGE: {
    label: 'Gestionar empresas',
    description: 'Crear y editar empresas',
  },
  AREA_READ: { label: 'Ver áreas', description: 'Ver áreas' },
  AREA_MANAGE: {
    label: 'Gestionar áreas',
    description: 'Crear y editar áreas',
  },
  SETTINGS_READ: {
    label: 'Ver configuración',
    description: 'Ver configuración de la organización',
  },
  SETTINGS_MANAGE: {
    label: 'Gestionar configuración',
    description: 'Modificar configuración',
  },
  AUDIT_LOG_READ: {
    label: 'Ver auditoría',
    description: 'Ver registro de auditoría',
  },
  TASK_READ: {
    label: 'Ver tareas propias',
    description: 'Ver tareas asignadas al usuario',
  },
  TASK_READ_ALL: {
    label: 'Ver todas las tareas',
    description: 'Ver tareas de todos los usuarios de la organización',
  },
  TASK_MANAGE: {
    label: 'Gestionar tareas propias',
    description: 'Crear, editar, completar y eliminar tareas propias',
  },
  TASK_MANAGE_ALL: {
    label: 'Gestionar todas las tareas',
    description:
      'Crear, editar, completar, reasignar y eliminar tareas de cualquier usuario',
  },
  CRM_READ: {
    label: 'Ver área comercial',
    description:
      'Ver oportunidades, contactos, interacciones y tareas comerciales',
  },
  CRM_MANAGE: {
    label: 'Gestionar área comercial',
    description:
      'Crear, editar y eliminar oportunidades, contactos e interacciones, y configurar el área comercial',
  },
  ORGANIZATION_MANAGE: {
    label: 'Gestionar organización',
    description: 'Configurar el branding de la organización (logo)',
  },
};

export const PERMISSION_SEED = Object.values(PermissionCode).map((code) => ({
  code,
  ...PERMISSIONS[code],
}));

/** The Permission codes each default Role starts with. */
export const ADMINISTRADOR_CODES: PermissionCode[] =
  Object.values(PermissionCode);
/** Administrador-only codes stay out of the Manager's defaults. */
export const MANAGER_CODES = ADMINISTRADOR_CODES.filter(
  (c) =>
    c !== PermissionCode.ROLE_MANAGE &&
    c !== PermissionCode.ORGANIZATION_MANAGE,
);
export const BASIC_CODES: PermissionCode[] = [
  PermissionCode.CANDIDATE_READ,
  PermissionCode.CANDIDATE_MANAGE,
  PermissionCode.VACANCY_READ,
  PermissionCode.VACANCY_MANAGE,
  PermissionCode.USER_READ,
  PermissionCode.COMPANY_READ,
  PermissionCode.AREA_READ,
  PermissionCode.SETTINGS_READ,
  PermissionCode.TASK_READ,
  PermissionCode.TASK_MANAGE,
];
