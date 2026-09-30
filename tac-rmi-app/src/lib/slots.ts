export const FRANJAS_NO_OFRECER = ["NO DAR", "ALMUERZO", "CENA", ""];

export type TipoSolicitud = "TC" | "RM" | "PUNCION" | "DRENAJE" | "ETE" | "ECO";

export function franjaRequerida(params: {
  modalidad: "TC" | "RM" | "ECO";
  tipoSolicitud: TipoSolicitud;
  contraste?: boolean;
  anestesia?: boolean;
  estudioNombre?: string;
}): string | null {
  const { modalidad, tipoSolicitud, contraste, anestesia, estudioNombre } = params;
  const nombreLower = (estudioNombre || "").toLowerCase();

  if (tipoSolicitud === "PUNCION" || nombreLower.includes("puncion")) return "PUNCION";
  if (tipoSolicitud === "DRENAJE" || nombreLower.includes("drenaje")) return "DRENAJES";
  if (tipoSolicitud === "ETE" || nombreLower.includes("ete")) return null; // Turno libre sin grilla
  if (tipoSolicitud === "ECO" || modalidad === "ECO") return null; // Turno libre mientras no haya grilla formal de ECO

  if (anestesia) return "ANESTESIA";

  if (modalidad === "RM") {
    return contraste ? "CON GADOLINIO" : "SIN GADOLINIO";
  }

  // TC
  return contraste ? "CON CONTRASTE" : "SIN CONTRASTE";
}
