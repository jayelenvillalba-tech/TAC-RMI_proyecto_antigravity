import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // 1. Crear una orden de prueba rápida
    const [testOrder] = await db
      .insert(orders)
      .values({
        numeroOrden: "TEST-CONCURRENCY",
        tipoSolicitud: "TC",
        tipoPaciente: "Ambulatorio",
        pacienteNombre: "TEST PACIENTE CONCURRENTE",
        pacienteDni: "99.999.999",
        servicioNombre: "Cirugía",
        medicoSolicitante: "Dr. Concurrencia",
        estudio1: "TC de Tórax",
        motivo: "Prueba de doble reserva concurrente",
        estado: "Pendiente",
      })
      .returning();

    const fechaTest = "2026-11-20";
    const horaTest = "08:00";
    const modalidadTest = "TC";

    // 2. Disparar dos inserciones simultáneas exactas con Promise.all
    const intentos = await Promise.allSettled([
      db.insert(appointments).values({
        orderId: testOrder.id,
        modalidad: modalidadTest,
        fecha: fechaTest,
        hora: horaTest,
        tipoFranja: "CON CONTRASTE",
        estado: "activo",
      }),
      db.insert(appointments).values({
        orderId: testOrder.id,
        modalidad: modalidadTest,
        fecha: fechaTest,
        hora: horaTest,
        tipoFranja: "CON CONTRASTE",
        estado: "activo",
      }),
    ]);

    // Limpieza de datos de prueba
    await db.delete(appointments).where(eq(appointments.orderId, testOrder.id));
    await db.delete(orders).where(eq(orders.id, testOrder.id));

    const exito1 = intentos[0].status === "fulfilled";
    const exito2 = intentos[1].status === "fulfilled";
    const falloBloqueado = intentos[0].status === "rejected" || intentos[1].status === "rejected";

    return NextResponse.json({
      resumen: "Test de concurrencia completado",
      reserva1: intentos[0].status,
      reserva2: intentos[1].status,
      dobleReservaPrevenida: (exito1 && !exito2) || (!exito1 && exito2),
      detalleError: falloBloqueado ? "Restricción única de PostgreSQL (idx_unique_active_slot) bloqueó la segunda reserva" : "Error inesperado",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
