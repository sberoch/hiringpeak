/**
 * Snapshot of an entity reference captured at audit-write time. Survives the
 * referenced entity being deleted or renamed; reflects what the actor saw.
 */
export interface AuditEntityRef {
  type: string;
  label: string;
}

/**
 * Business context recorded in an audit row's metadata. `primary` is the
 * entity the action was performed on; `related` are extra entities the
 * action implicates (assignments, comments, file owners, etc.).
 */
export interface AuditContext {
  primary?: AuditEntityRef;
  related?: AuditEntityRef[];
}

/**
 * Request-side details captured for trace/forensics. Surfaced behind the
 * row-expand panel on the audit log UI.
 */
export interface AuditClientInfo {
  ip?: string;
  userAgent?: string;
}

export interface AuditMetadata {
  context?: AuditContext;
  client?: AuditClientInfo;
}

/**
 * Spanish display label for each audited event type. Source of truth for both
 * the audit log UI and the CSV export.
 */
export const AUDIT_EVENT_LABELS: Record<string, string> = {
  create_user: "Usuario creado",
  update_user: "Usuario actualizado",
  delete_user: "Usuario eliminado",
  create_role: "Rol creado",
  update_role: "Rol actualizado",
  delete_role: "Rol eliminado",
  create_candidate: "Postulante creado",
  update_candidate: "Postulante actualizado",
  delete_candidate: "Postulante eliminado",
  blacklist_candidate: "Postulante en lista negra",
  create_vacancy: "Vacante creada",
  update_vacancy: "Vacante actualizada",
  close_vacancy: "Vacante cerrada",
  reopen_vacancy: "Vacante reabierta",
  delete_vacancy: "Vacante eliminada",
  create_vacancy_status: "Estado de vacante creado",
  update_vacancy_status: "Estado de vacante actualizado",
  delete_vacancy_status: "Estado de vacante eliminado",
  create_industry: "Industria creada",
  update_industry: "Industria actualizada",
  delete_industry: "Industria eliminada",
  create_company: "Empresa creada",
  update_company: "Empresa actualizada",
  delete_company: "Empresa eliminada",
  create_comment: "Comentario creado",
  update_comment: "Comentario actualizado",
  delete_comment: "Comentario eliminado",
  create_candidate_vacancy_status: "Estado postulante-vacante creado",
  update_candidate_vacancy_status: "Estado postulante-vacante actualizado",
  delete_candidate_vacancy_status: "Estado postulante-vacante eliminado",
  create_candidate_vacancy: "Postulante asignado a vacante",
  update_candidate_vacancy: "Postulante-vacante actualizado",
  delete_candidate_vacancy: "Postulante desasignado de vacante",
  create_candidate_source: "Origen de postulante creado",
  update_candidate_source: "Origen de postulante actualizado",
  delete_candidate_source: "Origen de postulante eliminado",
  create_candidate_file: "Archivo de postulante creado",
  update_candidate_file: "Archivo de postulante actualizado",
  delete_candidate_file: "Archivo de postulante eliminado",
  create_blacklist_entry: "Entrada en lista negra creada",
  update_blacklist_entry: "Entrada en lista negra actualizada",
  delete_blacklist_entry: "Entrada en lista negra eliminada",
  remove_candidate_from_blacklist: "Postulante quitado de lista negra",
  create_area: "Área creada",
  update_area: "Área actualizada",
  delete_area: "Área eliminada",
};

/** Spanish display label for each audited entity type. */
export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  user: "Usuario",
  role: "Rol",
  candidate: "Postulante",
  vacancy: "Vacante",
  vacancy_status: "Estado de vacante",
  industry: "Industria",
  company: "Empresa",
  comment: "Comentario",
  candidate_vacancy_status: "Estado postulante-vacante",
  candidate_vacancy: "Asignación postulante-vacante",
  candidate_source: "Origen de postulante",
  candidate_file: "Archivo de postulante",
  blacklist: "Lista negra",
  area: "Área",
};

/**
 * Audit log entry as returned by the list API (with optional actor display info).
 */
export interface AuditLogItem {
  id: number;
  eventType: string;
  organizationId: number;
  actorUserId: number;
  entityType: string;
  entityId: number | null;
  metadata: AuditMetadata | null;
  createdAt: string;
  /** Optional: actor display name (when joined). */
  actorName?: string;
  /** Optional: actor email (when joined). */
  actorEmail?: string;
}
