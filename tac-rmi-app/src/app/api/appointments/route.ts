import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, orders, orderHistory, auditLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, modalidad, fecha, hora, tipoFranja, usuario } = body;

    if (!orderId || !modalidad || !fecha || !hora || !tipoFranja) {
      return NextResponse.json({ error: "Faltan parámetros obligatorios" }, { status: 400 });
    }

    // 1. Verificar si ya existe un turno activo en esa franja (seguridad a nivel aplicación)
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.modalidad, modalidad),
          eq(appointments.fecha, fecha),
          eq(appointments.hora, hora),
          eq(appointments.estado, "activo")
        )
      );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Conflicto: Esta franja horaria ya ha sido reservada por otro usuario (Doble Reserva Prevenida)" },
        { status: 409 }
      );
    }

    // 2. Insertar el turno (protegido además por el UNIQUE INDEX parcial en PostgreSQL)
    const [newAppt] = await db
      .insert(appointments)
      .values({
        orderId,
        modalidad,
        fecha,
        hora,
        tipoFranja,
        estado: "activo",
      })
      .returning();

    // 3. Actualizar estado de la orden a 'Turno asignado'
    await db
      .update(orders)
      .set({ estado: "Turno asignado" })
      .where(eq(orders.id, orderId));

    // 4. Historial
    await db.insert(orderHistory).values({
      orderId,
      usuario: usuario || "Secretaría",
      mensaje: `Turno asignado: ${modalidad} el ${fecha} a las ${hora} hs (${tipoFranja})`,
    });

    // 5. Auditoría
    await db.insert(auditLog).values({
      usuario: usuario || "Secretaría",
      accion: "ASSIGN_APPOINTMENT",
      entidad: "appointments",
      entidadId: newAppt.id,
      detalle: { orderId, modalidad, fecha, hora, tipoFranja },
    });

    return NextResponse.json(newAppt, { status: 201 });
  } catch (error: any) {
    // Si PostgreSQL dispara la violación del índice único parcial 'idx_unique_active_slot' (código 23505)
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Violación de restricción única en base de datos: Franja horaria ya ocupada." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
