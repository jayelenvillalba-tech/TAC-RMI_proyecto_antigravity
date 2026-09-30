import { z } from "zod";

export const orderFormSchema = z.object({
  tipoSolicitud: z.enum(["TC", "RM", "PUNCION", "DRENAJE", "ETE", "ECO"]),
  tipoPaciente: z.enum(["Ambulatorio", "Internado"]),
  
  // Paciente
  pacienteNombre: z.string().min(3, "El nombre y apellido son obligatorios"),
  pacienteDni: z.string().min(6, "DNI obligatorio"),
  pacienteHc: z.string().optional(),
  pacienteEdad: z.string().optional(),
  peso: z.string().optional(),
  
  // Ubicación requerida para internados
  sala: z.string().optional(),
  cama: z.string().optional(),
  
  // Servicio
  servicioNombre: z.string().min(1, "Servicio solicitante obligatorio"),
  medicoSolicitante: z.string().min(3, "Médico solicitante obligatorio"),
  matricula: z.string().optional(),
  procedencia: z.enum(["GUARDIA", "INTERNACION", "CONS_EXTERNO", "OTROS"]).optional(),
  
  // Estudio
  estudio1: z.string().min(3, "El estudio principal es obligatorio"),
  estudio2: z.string().optional(),
  contraste: z.boolean().default(false),
  anestesia: z.boolean().default(false),
  motivo: z.string().min(5, "El motivo clínico es obligatorio"),
  diagnosticoPresuntivo: z.string().optional(),
  observaciones: z.string().optional(),
  
  // Checklist de Seguridad
  antRenal: z.boolean().default(false),
  antRenalCual: z.string().optional(),
  antAsma: z.boolean().default(false),
  antClaustrofobia: z.boolean().default(false),
  antImplantes: z.boolean().default(false),
  antImplantesCuales: z.string().optional(),
  antRmPrevia: z.boolean().default(false),
  antRmFecha: z.string().optional(),
}).refine((data) => {
  // Regla: si es Internado, sala y cama son obligatorias
  if (data.tipoPaciente === "Internado") {
    return !!data.sala && !!data.cama;
  }
  return true;
}, {
  message: "Para pacientes internados, la Sala y Cama son estrictamente obligatorias",
  path: ["sala"],
}).refine((data) => {
  // Regla: si tiene implantes metálicos, debe detallar cuáles
  if (data.antImplantes) {
    return !!data.antImplantesCuales && data.antImplantesCuales.trim().length > 0;
  }
  return true;
}, {
  message: "Debe especificar el material y tipo de implante metálico",
  path: ["antImplantesCuales"],
});
