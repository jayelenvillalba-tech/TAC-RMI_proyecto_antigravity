# Sistema TAC/RMI - Hospital Escuela Eva Perón
## Servicio de Diagnóstico por Imágenes

> ⚠️ **MAQUETA DE DEMOSTRACIÓN** — Solo datos ficticios — No ingresar datos reales de pacientes.

---

## Descripción
Sistema web de gestión de órdenes y turnos de Tomografía Computada (TC) y Resonancia Magnética (RM) para el Hospital Escuela Eva Perón.

## Estructura del proyecto
```
prototype/          ← Maqueta funcional (sin backend, localStorage)
  index.html        ← App de una sola página
forms/              ← Formulario 599 PDF y script generador
data/
  grids.json        ← Grillas de turnos TC y RM
reference/          ← Formulario original escaneado
```

## Fase 0 — Maqueta
- Abrí `prototype/index.html` en cualquier navegador moderno
- Los datos se guardan solo en tu navegador (localStorage)
- Sin login real: seleccioná el rol al iniciar
- Horarios en UTC (la versión real usará UTC-3 / America/Argentina/Buenos_Aires)

### Limitaciones conocidas de la maqueta
- Sin persistencia entre dispositivos
- Sin autenticación real
- Sin generación/lectura de PDFs
- Sin notificaciones
- Horarios en UTC en lugar de hora argentina

## Tecnologías (Fases 1+)
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL (Supabase o Neon) + Prisma
- pdf-lib para generación y lectura de PDFs
- Resend / SMTP para emails
- Playwright para tests e2e
- Vercel para deploy

## Preguntas abiertas (resolver con el equipo antes de la Fase 1)
Ver documento principal del proyecto.
