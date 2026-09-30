import { pgTable, text, boolean, timestamp, uuid, smallint, time, date, numeric, bigserial, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// 1. Servicios Médicos
export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  emails: text("emails").array().default(sql`'{}'::text[]`),
  telefonos: text("telefonos").array().default(sql`'{}'::text[]`),
  whatsapp: text("whatsapp"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 2. Usuarios
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull().unique(),
  rol: text("rol").notNull(), // 'medico','secretaria','sala_medicos','anestesia','admin','auditor','camillero'
  serviceId: uuid("service_id").references(() => services.id),
  matricula: text("matricula"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 3. Plantillas de Grillas / Franjas
export const slotTemplates = pgTable("slot_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  modalidad: text("modalidad").notNull(), // 'TC', 'RM', 'ECO'
  diaSemana: smallint("dia_semana").notNull(), // 1=lun ... 7=dom
  hora: time("hora").notNull(),
  tipoFranja: text("tipo_franja").notNull(), // 'SIN CONTRASTE', 'CON CONTRASTE', etc.
  activo: boolean("activo").default(true),
});

// 4. Pacientes
export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  dni: text("dni").notNull(),
  apellidoNombre: text("apellido_nombre").notNull(),
  fechaNacimiento: date("fecha_nacimiento"),
  hc: text("hc"),
  obraSocial: text("obra_social"),
  domicilio: text("domicilio"),
  localidad: text("localidad"),
  telefono: text("telefono"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 5. Órdenes Digitales (Form 599 completo)
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  numeroOrden: text("numero_orden").notNull(), // Ej: 2026-001
  tipoSolicitud: text("tipo_solicitud").notNull(), // TC, RM, PUNCION, DRENAJE, ETE, ECO
  tipoPaciente: text("tipo_paciente").notNull(), // Ambulatorio, Internado
  
  // Paciente
  patientId: uuid("patient_id").references(() => patients.id),
  pacienteNombre: text("paciente_nombre").notNull(),
  pacienteDni: text("paciente_dni").notNull(),
  pacienteHc: text("paciente_hc"),
  pacienteEdad: text("paciente_edad"),
  peso: numeric("peso", { precision: 5, scale: 1 }),
  
  // Ubicación internados
  sala: text("sala"),
  cama: text("cama"),
  
  // Solicitante
  serviceId: uuid("service_id").references(() => services.id),
  servicioNombre: text("servicio_nombre").notNull(),
  medicoSolicitante: text("medico_solicitante").notNull(),
  matricula: text("matricula"),
  procedencia: text("procedencia"), // GUARDIA, INTERNACION, CONS_EXTERNO, OTROS
  
  // Estudio
  estudio1: text("estudio_1").notNull(),
  estudio2: text("estudio_2"),
  contraste: boolean("contraste").default(false),
  anestesia: boolean("anestesia").default(false),
  motivo: text("motivo").notNull(),
  diagnosticoPresuntivo: text("diagnostico_presuntivo"),
  observaciones: text("observaciones"),
  
  // Checklist de Seguridad
  antRenal: boolean("ant_renal").default(false),
  antRenalCual: text("ant_renal_cual"),
  antAsma: boolean("ant_asma").default(false),
  antClaustrofobia: boolean("ant_claustrofobia").default(false),
  antImplantes: boolean("ant_implantes").default(false),
  antImplantesCuales: text("ant_implantes_cuales"),
  antRmPrevia: boolean("ant_rm_previa").default(false),
  antRmFecha: date("ant_rm_fecha"),
  
  // Estado del flujo
  estado: text("estado").default("Pendiente").notNull(), // Pendiente, Turno asignado, Realizado, Ausente, Cancelada, Suspendida
  motivoSuspension: text("motivo_suspension"),
  
  // Notificación Anestesia
  visAnestesia: boolean("vis_anestesia").default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 6. Turnos Asignados con RESTRICCIÓN ÚNICA PARCIAL ANTI-DOBLE RESERVA
export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  modalidad: text("modalidad").notNull(), // TC, RM, ECO
  fecha: date("fecha").notNull(),
  hora: text("hora").notNull(), // '08:00', '08:30', etc.
  tipoFranja: text("tipo_franja").notNull(),
  estado: text("estado").default("activo").notNull(), // activo, reprogramado, cancelado
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    // Restricción única parcial: no puede haber dos turnos activos en la misma modalidad, fecha y hora
    uniqueActiveSlot: uniqueIndex("idx_unique_active_slot")
      .on(table.modalidad, table.fecha, table.hora)
      .where(sql`${table.estado} = 'activo'`),
  };
});

// 7. Historial de Cambios / Trazabilidad
export const orderHistory = pgTable("order_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  usuario: text("usuario").notNull(),
  mensaje: text("mensaje").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 8. Registro de Auditoría Inmutable (Solo Insert)
export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  usuario: text("usuario"),
  accion: text("accion").notNull(), // 'login', 'create_order', 'assign_slot', 'view_pdf', etc.
  entidad: text("entidad"),
  entidadId: text("entidad_id"),
  detalle: jsonb("detalle"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
