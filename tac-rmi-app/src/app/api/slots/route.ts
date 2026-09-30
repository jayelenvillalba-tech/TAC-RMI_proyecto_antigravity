import { NextResponse } from "next/server";
import { db } from "@/db";
import { slotTemplates, appointments, orders } from "@/db/schema";
import { franjaRequerida, FRANJAS_NO_OFRECER } from "@/lib/slots";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const fecha = searchParams.get("fecha"); // 'YYYY-MM-DD'

    if (!orderId || !fecha) {
      return NextResponse.json({ error: "orderId y fecha son obligatorios" }, { status: 400 });
    }

    const [orden] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const mod = orden.tipoSolicitud === "RM" ? "RM" : "TC";
    const frReq = franjaRequerida({
      modalidad: mod,
      tipoSolicitud: orden.tipoSolicitud as any,
      contraste: orden.contraste || false,
      anestesia: orden.anestesia || false,
      estudioNombre: orden.estudio1,
    });

    const targetDate = new Date(`${fecha}T00:00:00Z`);
    // getUTCDay: 0=domingo, 1=lunes ... 6=sabado
    const dayOfWeek = targetDate.getUTCDay();
    const diaSemanaDb = dayOfWeek === 0 ? 7 : dayOfWeek; // 1=lun ... 7=dom

    // 1. Obtener todas las plantillas de franjas para esa modalidad y día de la semana
    const plantillas = await db
      .select()
      .from(slotTemplates)
      .where(
        and(
          eq(slotTemplates.modalidad, mod),
          eq(slotTemplates.diaSemana, diaSemanaDb),
          eq(slotTemplates.activo, true)
        )
      );

    // 2. Obtener turnos ya asignados para esa modalidad y fecha específica
    const ocupados = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.modalidad, mod),
          eq(appointments.fecha, fecha),
          eq(appointments.estado, "activo")
        )
      );

    const horasOcupadas = new Set(ocupados.map((a) => a.hora));

    // 3. Filtrar según reglas de negocio
    const disponibles = plantillas.filter((slot) => {
      // Descartar no ofrecidas
      if (FRANJAS_NO_OFRECER.includes(slot.tipoFranja)) return false;
      // Descartar si ya está ocupado
      if (horasOcupadas.has(slot.hora)) return false;

      // Si el estudio requiere una franja específica
      if (frReq) {
        if (slot.tipoFranja === "RESERVADO INTERNADO") {
          return orden.tipoPaciente === "Internado";
        }
        return slot.tipoFranja === frReq;
      }
      return true;
    });

    return NextResponse.json({
      modalidad: mod,
      franjaRequerida: frReq,
      fecha,
      disponibles: disponibles.map((s) => ({ hora: s.hora, franja: s.tipoFranja })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
