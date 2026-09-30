import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [orden] = await db.select().from(orders).where(eq(orders.id, id));

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const formPath = path.resolve(process.cwd(), "../forms/Formulario_599_TAC-RMI_completable.pdf");
    const formPdfBytes = fs.readFileSync(formPath);
    const pdfDoc = await PDFDocument.load(formPdfBytes);
    const form = pdfDoc.getForm();

    const setSafeText = (name: string, val: string | null | undefined) => {
      try {
        const field = form.getTextField(name);
        if (field && val) field.setText(val);
      } catch (e) {}
    };

    const setSafeRadio = (name: string, val: string) => {
      try {
        const field = form.getRadioGroup(name);
        if (field) field.select(val);
      } catch (e) {}
    };

    setSafeText("apellido_nombre", orden.pacienteNombre);
    setSafeText("dni", orden.pacienteDni);
    setSafeText("hc", orden.pacienteHc || "");
    setSafeText("edad", orden.pacienteEdad || "");
    setSafeText("peso", orden.peso ? String(orden.peso) : "");
    setSafeText("sala", orden.sala || "");
    setSafeText("cama", orden.cama || "");
    setSafeText("servicio", orden.servicioNombre);
    setSafeText("medico_solicitante", orden.medicoSolicitante);
    setSafeText("matricula", orden.matricula || "");
    setSafeText("estudio_1", orden.estudio1);
    setSafeText("estudio_2", orden.estudio2 || "");
    setSafeText("motivo", orden.motivo);
    setSafeText("diagnostico_presuntivo", orden.diagnosticoPresuntivo || "");
    setSafeText("observaciones", orden.observaciones || "");

    setSafeRadio("contraste", orden.contraste ? "SI" : "NO");
    setSafeRadio("anestesia", orden.anestesia ? "SI" : "NO");
    setSafeRadio("ant_asma", orden.antAsma ? "SI" : "NO");
    setSafeRadio("ant_claustrofobia", orden.antClaustrofobia ? "SI" : "NO");
    setSafeRadio("ant_implantes", orden.antImplantes ? "SI" : "NO");
    setSafeText("ant_implantes_cuales", orden.antImplantesCuales || "");
    setSafeRadio("ant_renal", orden.antRenal ? "SI" : "NO");
    setSafeText("ant_renal_cual", orden.antRenalCual || "");
    setSafeRadio("ant_rm_previa", orden.antRmPrevia ? "SI" : "NO");

    const pdfBytes = await pdfDoc.save();
    const sha256 = crypto.createHash("sha256").update(Buffer.from(pdfBytes)).digest("hex");

    await db.insert(auditLog).values({
      usuario: "Sistema",
      accion: "GENERATE_AND_VIEW_PDF",
      entidad: "orders",
      entidadId: orden.id,
      detalle: { numeroOrden: orden.numeroOrden, sha256 },
    });

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Form599_${orden.numeroOrden}.pdf"`,
        "X-PDF-SHA256": sha256,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
