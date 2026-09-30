import { db } from "./index";
import { services, slotTemplates } from "./schema";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Cargando datos iniciales en Supabase...");

  // 1. Servicios
  const serviciosDefault = [
    "Cirugía", "Clínica Médica", "Guardia", "OyT", 
    "Traumatología", "Neurología", "Pediatría", "Ginecología", "Cardiología"
  ];
  
  for (const s of serviciosDefault) {
    try {
      await db.insert(services).values({ nombre: s });
    } catch (e) {
      // Ignorar si ya existe
    }
  }
  console.log("✓ Servicios precargados");

  // 2. Grillas desde data/grids.json
  const gridsPath = path.resolve(process.cwd(), "../data/grids.json");
  const raw = fs.readFileSync(gridsPath, "utf-8");
  const grids = JSON.parse(raw);
  const dias = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

  for (const modalidad of ["TC", "RM"]) {
    const list = grids[modalidad] || [];
    for (const row of list) {
      for (let i = 0; i < dias.length; i++) {
        const diaNombre = dias[i];
        const franja = row[diaNombre];
        if (franja && franja !== "NO DAR" && franja !== "ALMUERZO" && franja !== "CENA") {
          try {
            await db.insert(slotTemplates).values({
              modalidad,
              diaSemana: i + 1,
              hora: row.hora,
              tipoFranja: franja,
            });
          } catch (e) {
            // Ignorar duplicados
          }
        }
      }
    }
  }
  console.log("✓ Grillas de TC y RM insertadas correctamente");
  process.exit(0);
}

main().catch(err => {
  console.error("Error en seed:", err);
  process.exit(1);
});
