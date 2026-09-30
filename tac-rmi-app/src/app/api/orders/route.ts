import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderHistory, auditLog } from "@/db/schema";
import { orderFormSchema } from "@/lib/validations";

export async function GET() {
  try {
    const list = await db.select().from(orders).orderBy(orders.createdAt);
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = orderFormSchema.parse(body);

    // Contar órdenes para generar número correlativo
    const countRes = await db.select().from(orders);
    const correlativo = `2026-${String(countRes.length + 1).padStart(3, "0")}`;

    const [newOrder] = await db.insert(orders).values({
      numeroOrden: correlativo,
      tipoSolicitud: parsed.tipoSolicitud,
      tipoPaciente: parsed.tipoPaciente,
      pacienteNombre: parsed.pacienteNombre.toUpperCase(),
      pacienteDni: parsed.pacienteDni,
      pacienteHc: parsed.pacienteHc,
      pacienteEdad: parsed.pacienteEdad,
      peso: parsed.peso ? parsed.peso : null,
      sala: parsed.sala,
      cama: parsed.cama,
      servicioNombre: parsed.servicioNombre,
      medicoSolicitante: parsed.medicoSolicitante,
      matricula: parsed.matricula,
      procedencia: parsed.procedencia,
      estudio1: parsed.estudio1,
      estudio2: parsed.estudio2,
      contraste: parsed.contraste,
      anestesia: parsed.anestesia,
      motivo: parsed.motivo,
      diagnosticoPresuntivo: parsed.diagnosticoPresuntivo,
      observaciones: parsed.observaciones,
      antRenal: parsed.antRenal,
      antRenalCual: parsed.antRenalCual,
      antAsma: parsed.antAsma,
      antClaustrofobia: parsed.antClaustrofobia,
      antImplantes: parsed.antImplantes,
      antImplantesCuales: parsed.antImplantesCuales,
      antRmPrevia: parsed.antRmPrevia,
      antRmFecha: parsed.antRmFecha ? parsed.antRmFecha : null,
      visAnestesia: parsed.anestesia ? false : true,
      estado: "Pendiente",
    }).returning();

    // Guardar en historial de trazabilidad
    await db.insert(orderHistory).values({
      orderId: newOrder.id,
      usuario: parsed.medicoSolicitante,
      mensaje: "Orden médica creada digitalmente",
    });

    // Guardar en audit_log inmutable
    await db.insert(auditLog).values({
      usuario: parsed.medicoSolicitante,
      accion: "CREATE_ORDER",
      entidad: "orders",
      entidadId: newOrder.id,
      detalle: { numeroOrden: correlativo, estudio: parsed.estudio1 },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
