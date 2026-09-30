# PROMPT / PLAN – Sistema de órdenes y turnos de Tomografía y Resonancia
**Hospital Escuela Eva Perón – Servicio de Diagnóstico por Imágenes**

> Leé este documento completo antes de escribir código. Primero desplegá la maqueta (Fase 0), después **devolveme un plan técnico y las preguntas que tengas** antes de implementar las Fases 1 en adelante. No uses datos reales de pacientes en ningún momento del desarrollo: solo datos ficticios.

---

## 1. Qué queremos lograr
Hoy las órdenes de TC/RM se completan en papel (Form 599), los turnos se dan a mano según una grilla en Excel, y anestesia se entera por mensajes de WhatsApp que se anotan en un libro. Queremos un sistema web que:

1. Reciba la orden digital del médico (se generan los mismos datos del Form 599) y **guarde también el PDF** de la orden.
2. Mantenga **dos colas**: ambulatorios (los gestiona Secretaría) e internados (los gestiona Sala de médicos).
3. Asigne **turnos reales** respetando las grillas de TC y RM (contraste, gadolinio, anestesia, punciones, drenajes, franjas reservadas a internados).
4. Dé a **anestesia** una agenda propia con novedades (cambios, suspensiones) y confirmación de lectura.
5. Avise a los **servicios con pacientes internados** (email/teléfono) cuándo el paciente tiene turno o debe bajar.
6. Registre la **demanda por servicio** y deje **auditoría** de todos los accesos y cambios.

## 2. Qué hay en este paquete
| Ruta | Contenido |
|---|---|
| `prototype/index.html` | Maqueta funcional (un solo HTML, sin backend). Los datos viven en `localStorage`. **Es la referencia de comportamiento y de UX.** |
| `forms/Formulario_599_TAC-RMI_completable.pdf` | Form 599 rehecho con campos PDF (AcroForm) con nombres definidos. Página 2 = consentimiento informado. |
| `forms/build_form_pdf.py` | Script (Python + reportlab) que genera ese PDF. Ahí están los **nombres de campo** (sección 6.3). |
| `reference/NUEVO_FORMULARIO_TAC-RMI.pdf` | Escaneo del formulario original en papel (en blanco). |
| `data/GRILLA_DE_TURNOS_RMI.xlsx`, `GRILLA_DE_TURNOS_TAC.xlsx` | Grillas originales de turnos. |
| `data/grids.json` | Las mismas grillas ya convertidas: `[hora, lun, mar, mié, jue, vie, sáb, dom]`; celda vacía = sin turnos. |

## 3. Fase 0 – Publicar la maqueta (hacer ya)
- Subir `prototype/` a un repositorio de GitHub y desplegarlo en Vercel como sitio estático (Root Directory = `prototype`, framework "Other"). No requiere build.
- Objetivo: que el equipo del hospital pueda abrirla y opinar. Aclarar en pantalla que es una **maqueta con datos ficticios**.
- Conocidos: los datos se guardan solo en el navegador de cada persona, no hay login, y las marcas de tiempo usan UTC (corregir en la versión real: zona `America/Argentina/Buenos_Aires`).

## 4. Usuarios y permisos

| Rol | Puede cargar órdenes | Ve | Gestiona / modifica |
|---|---|---|---|
| Médico de servicio | Sí (ambulatorio e internado) | Ambas colas y agenda del día (solo lectura) | Solo sus propias órdenes hasta que tengan turno |
| Secretaría (Diagnóstico) | Sí | Todo | **Cola de ambulatorios**: asignar, reprogramar, cerrar turnos |
| Sala de médicos (Diagnóstico) | Sí | Todo | **Cola de internados** y **solicitudes de ecografía** |
| Anestesia | No | Su agenda (órdenes con anestesia) | Solo "Enterado" de las novedades |
| Jefe de Diagnóstico / Admin del servicio | — | Todo + reportes | Usuarios del servicio, grillas, directorio de servicios |
| Auditor | — | Registro de auditoría | Solo lectura (ver sección 9) |
| Camillero *(a confirmar)* | No | Internados con turno del día, con sala y cama | Marcar "paciente retirado / entregado" |

Reglas: cada persona tiene **usuario individual**. Secretaría y Sala de médicos modifican solo su cola; cualquiera ve ambas para saber "cómo viene el día".

## 5. Reglas de negocio (ya implementadas en la maqueta; replicar y cubrir con tests)

### 5.1 Tipo de paciente y servicio
- Dos datos independientes: **tipo** (Ambulatorio | Internado) define la cola; **servicio solicitante** (lista cerrada: Cirugía, Clínica Médica, Guardia, OyT, Traumatología, Neurología, Pediatría, Ginecología, Otro…) define la demanda.
- Internado ⇒ **sala y cama obligatorias** (los camilleros necesitan saber dónde buscar).
- **Guardia** se registra siempre como **Internado** con cama (la guardia tiene camas), aunque después el paciente no se interne.

### 5.2 Franja de la grilla según el estudio
| Estudio | Franja requerida |
|---|---|
| RM con anestesia | `ANESTESIA` |
| RM con contraste (gadolinio) | `CON GADOLINIO` |
| RM sin contraste | `SIN GADOLINIO` |
| TC con anestesia | `ANESTESIA` |
| TC con contraste | `CON CONTRASTE` |
| TC sin contraste | `SIN CONTRASTE` |
| Punción (en TC) | `PUNCION` |
| Drenaje (en TC) | `DRENAJES` |
| ETE | **No tiene grilla**: fecha y hora libres |

- Un **internado** puede usar además las franjas `RESERVADO INTERNADO`. Un ambulatorio no.
- Nunca se ofrecen: `NO DAR`, `ALMUERZO`, `CENA`, celdas vacías, franjas ya ocupadas, ni horarios pasados.
- Capacidad por franja: 1 paciente. Al reprogramar se libera la franja anterior.
- **Contraste oral** ⇒ citar al paciente **30 minutos antes** del turno (mostrarlo en pantalla y en las notificaciones).
- *Supuestos a validar con el servicio*: que un estudio sin contraste no pueda ocupar una franja "con contraste"; y si una punción o un estudio con anestesia de TC también puede ir en `RESERVADO INTERNADO`.

### 5.3 Alertas de seguridad (visibles en colas, agenda y notificaciones)
- **Implantes metálicos = Sí** ⇒ alerta roja: *requisito fundamental, traer formato físico o fotocopia con tipo de material y constancia de compatibilidad con el resonador, con firma y sello del médico tratante; caso contrario el estudio NO se realiza.* Además exigir el campo "¿Cuáles?".
- **Asma o alergia severa** ⇒ alerta ámbar (avisar al médico antes de dar contraste).
- Claustrofobia, enfermedad renal, contraste y anestesia se muestran como etiquetas.
- RM previa = Sí ⇒ pedir fecha y recomendar traer estudios previos.

### 5.4 Estados de la orden
`Pendiente → Turno asignado → Realizado` o `Ausente | Cancelada | Suspendida`. Cada cambio de turno, estado, estudio, zona, cama, sala, contraste o anestesia queda registrado con fecha/hora/usuario (historial de la orden).

### 5.5 Agenda de anestesia
Muestra todas las órdenes con anestesia (TC, RM, punciones, ETE) agrupadas por día y hora, más las aún sin turno. Muestra suspendidas (rojo) y "ya no requiere anestesia". Cada novedad queda **pendiente hasta que anestesia toca "Enterado"** (se guarda quién y cuándo). Botón "copiar para WhatsApp" como puente.

## 6. Lo nuevo que hay que construir

### 6.1 Turnos reales (reemplaza `localStorage`)
- Backend + base de datos. Grillas configurables (tabla de franjas por modalidad/día/hora/tipo) **editables por el Admin** sin tocar código; cargar inicialmente desde `data/grids.json`.
- **Sin doble reserva**: restricción única en base de datos sobre (modalidad, fecha, hora) para turnos activos, dentro de una transacción. Test de concurrencia obligatorio (dos usuarios reservando la misma franja).
- Vistas: cola por ventanilla, "elegir turno" (primer libre / por día), agenda del día RM y TC, reprogramar y suspender con motivo.
- Horarios en zona `America/Argentina/Buenos_Aires` (guardar en UTC).

### 6.2 Orden digital + PDF guardado
- El médico completa el formulario web con **todos** los campos del Form 599. La maqueta solo tiene un subconjunto; **faltan**: HC, domicilio, localidad, teléfono, obra social, peso, fecha de nacimiento, efector, N° de matrícula, exámenes previos (sí/no), diagnóstico presuntivo, observaciones médicas del servicio, procedencia (guardia / internación / consultorio externo / otros). Agregarlos.
- Al enviar, el sistema **genera el PDF** de la orden (página 1, más el consentimiento informado cuando hay contraste) a partir de los datos, lo **guarda en almacenamiento privado** (no público; acceso por URL firmada y con permiso) y lo asocia a la orden con un hash (SHA-256) para detectar alteraciones. El PDF es el comprobante; los datos estructurados son la fuente de verdad.
- **Vía alternativa**: poder **subir el PDF completable** ya rellenado (`forms/Formulario_599_…pdf`) y que el sistema **lea los campos AcroForm** y precargue la orden (el médico revisa y confirma). Los nombres de campo están en la sección 6.3.
- Consentimiento informado: lo firma el paciente en persona. Guardar su PDF/escaneo firmado asociado a la orden (subida por Secretaría o firma en tablet). No lo firma el médico por el paciente.
- Firma del médico: definir con Legales/Sistemas si alcanza el usuario autenticado o se requiere firma digital (Ley 25.506) o prescripción electrónica (Ley 27.553). Dejar el diseño preparado para sumar firma digital.

### 6.3 Nombres de campo del PDF (AcroForm)
Página 1: `sala`, `cama`, `fecha`, `apellido_nombre`, `hc`, `dni`, `fn`, `edad`, `peso`, `domicilio`, `localidad`, `telefono`, `obra_social`, `procedencia` (radio: GUARDIA, INTERNACION, CONS_EXTERNO, OTROS), `servicio`, `efector`, `medico_solicitante`, `matricula`, `estudio_1`, `estudio_2`, `contraste` (radio SI/NO), `anestesia` (radio SI/NO), `motivo`, `examenes_previos` (radio), `diagnostico_presuntivo`, `ant_renal`, `ant_renal_cual`, `ant_asma`, `ant_claustrofobia`, `ant_implantes`, `ant_implantes_cuales`, `ant_rm_previa`, `ant_rm_fecha`, `observaciones`.
Página 2: `cons_paciente`, `cons_estudio`, `cons_medico`, `cons_autoriza` (radio SI/NO), `cons_fecha`, `cons_aclaracion`, `cons_documento`.
(Los radios SÍ/NO usan los valores `SI` y `NO`.)

### 6.4 Solicitudes de ecografía (solo internados)
- Nuevo tipo de solicitud **Ecografía**, **exclusiva para pacientes internados** (sala y cama obligatorias), mismo formato visual y mismo flujo de carga.
- Va **únicamente a la Sala de médicos** (cola propia). No aparece en la cola de ambulatorios.
- Campos propios: zona/tipo de ecografía, motivo, preparación (ayuno, vejiga llena, etc.), urgencia. **No** lleva las preguntas de seguridad de RM ni contraste.
- **No tenemos grilla de ecografía todavía**: dejar el modelo de grillas preparado para sumar una modalidad "ECO" cuando la pasen; mientras tanto turno libre (fecha/hora) como ETE.
- Aparece en la agenda del día y en los reportes de demanda.

### 6.5 Directorio de servicios y notificaciones
- Registro de **servicios médicos** (Cirugía, Clínica Médica, etc.) con: nombre, **email(s)**, **teléfono(s)** y, si se habilita, WhatsApp institucional; administrado por el Admin de Diagnóstico.
- Eventos que notifican al servicio del paciente **internado**:
  1. Se asignó turno (fecha, hora, estudio, indicaciones: ayuno, contraste oral → horario de citación).
  2. Se reprogramó o suspendió el turno.
  3. **"El paciente debe bajar ahora"**: botón "Llamar paciente" en la Sala de médicos que notifica al servicio y deja registro.
  4. Recordatorio previo (p. ej. la tarde anterior y 1 hora antes).
- Canales por etapas: **(a)** notificación dentro del sistema + **email institucional**; **(b)** WhatsApp Business API con plantillas aprobadas / SMS. Usar una capa de envío intercambiable y registrar cada intento (enviado, entregado, falló).
- **Privacidad de los mensajes**: incluir lo mínimo (apellido e inicial o HC, cama, hora, estudio). **Nunca** diagnóstico ni motivo clínico. Mantener copia del mensaje enviado en el historial.
- Para ambulatorios, avisar al paciente (email/SMS) es una mejora opcional posterior.

### 6.6 Rediseño visual
- Reformar la interfaz: identidad del hospital (logo, colores), diseño **mobile-first** (los médicos y camilleros usan celular), botones grandes, alto contraste y accesibilidad (teclado, lectores de pantalla), modo claro/oscuro.
- Jerarquía clara: alertas de seguridad siempre visibles y en rojo; estados con color y texto (no solo color).
- Componentes: tarjetas de orden, agenda del día como grilla/timeline, filtros por servicio/fecha/estado, impresión del comprobante.
- Pedir al equipo el **logo oficial del hospital y del servicio (DxI)** en SVG/PNG de alta calidad. El PDF actual usa texto en su lugar.

## 7. Modelo de datos (propuesta inicial)
`users`(id, nombre, email, rol, servicio_id?, activo) · `services`(id, nombre, emails[], telefonos[], whatsapp?) · `patients`(id, dni, apellido_nombre, fn, hc, obra_social, contacto…) · `orders`(id, tipo_solicitud [TC|RM|PUNCION|DRENAJE|ETE|ECO], tipo_paciente, servicio_id, medico_id, sala, cama, datos clínicos y antecedentes, estado, created_by…) · `order_documents`(id, order_id, kind [orden|consentimiento|constancia_implante], storage_key, sha256) · `order_history`(id, order_id, user_id, cambio, ts, visto_por_anestesia_por?, visto_ts?) · `slot_templates`(modalidad, dia_semana, hora, tipo_franja) · `appointments`(id, order_id, modalidad, fecha, hora, estado, **UNIQUE parcial activo**) · `notifications`(id, order_id, service_id, canal, plantilla, estado, ts) · `audit_log` (ver sección 9).

## 8. Stack sugerido (podés proponer alternativas)
Next.js (App Router) + TypeScript + Tailwind/shadcn, PostgreSQL (Supabase o Neon) con Prisma o Drizzle, almacenamiento privado de archivos, `pdf-lib` para generar y leer PDFs, Resend (o SMTP institucional) para email, Playwright para tests e2e. Validaciones con Zod en cliente y servidor. Desplegar en Vercel.

## 9. Seguridad, privacidad y auditoría (pensarlo bien antes de implementar)
**Criterio propuesto para el punto "cuenta particular para los accesos":**
1. **Cuentas individuales para todos**, incluido el personal de Diagnóstico. Evitar una cuenta compartida ("secretaria1") porque elimina la trazabilidad (no se sabría quién vio o cambió qué). Para que sea práctico en ventanillas con cambio de turno: login rápido, cambio de usuario ágil, cierre de sesión por inactividad.
2. **Cuenta administradora del servicio** (jefe de Diagnóstico o a quien designe): crea, suspende y cambia permisos de los usuarios de Diagnóstico y administra grillas y directorio.
3. **Rol Auditor separado**: único que consulta el registro de accesos. Idealmente no es la misma persona que administra los usuarios (separación de funciones). Definir con Sistemas/Dirección quién es.
4. **Registro de auditoría inmutable** (solo inserción, sin editar ni borrar; opcionalmente encadenado con hash): inicio y cierre de sesión (con IP y dispositivo), intentos fallidos, **cada vez que se abre una orden o un PDF**, cada alta/cambio/baja, envíos de notificaciones, cambios de permisos y de grillas.
5. Doble factor (TOTP) obligatorio para Admin y Auditor; contraseñas robustas; bloqueo por intentos fallidos.
6. Permisos a nivel de base de datos (Row Level Security o equivalente), no solo ocultar botones en pantalla.
7. Conservación: la historia clínica tiene plazos mínimos de guarda (Ley 26.529); **confirmar plazos con Legales**.
8. **Alojamiento de datos de salud**: son datos sensibles (Ley 25.326, Ley 26.529). Usar Vercel/Supabase u otros servicios en el exterior puede requerir análisis legal por transferencia internacional de datos. **Mientras tanto, solo datos ficticios.** Antes de cargar datos reales, definir con Sistemas y Legales dónde se aloja (nube o servidor del hospital) y dejar la arquitectura portable.

## 10. Fases y criterios de aceptación
| Fase | Contenido | Listo cuando… |
|---|---|---|
| 0 | Publicar la maqueta en Vercel | El equipo del hospital puede abrirla y probar el circuito con datos ficticios |
| 1 | Login individual, base de datos, orden digital completa, PDF generado y guardado, colas, turnos reales con grillas, agenda del día, auditoría | Dos usuarios no pueden reservar la misma franja; cada orden tiene su PDF; todo acceso queda auditado |
| 2 | Agenda de anestesia con "Enterado", directorio de servicios, notificaciones por email + "Llamar paciente", solicitudes de ecografía a Sala de médicos | Un internado con turno genera aviso al servicio; las ecografías solo llegan a Sala de médicos |
| 3 | Rediseño visual completo, reportes de demanda y tiempos de espera, edición de grillas por el Admin, carga de PDF completable con lectura de campos | El jefe de servicio puede cambiar una grilla y ver la demanda por servicio |
| 4 | WhatsApp institucional/SMS, firma digital, integración con SAMCo, camilleros | A definir con Sistemas |

## 11. Preguntas abiertas (resolver con el equipo antes de la Fase 1)
1. ¿Quién es el Auditor y quién administra los usuarios de Diagnóstico?
2. ¿Dónde se aloja el sistema con datos reales? ¿Hay servidor propio del hospital?
3. ¿Se acepta el usuario autenticado como firma del médico o se exige firma digital?
4. ¿Existe grilla de ecografías? ¿Qué franjas y horarios?
5. ¿Las reglas de compatibilidad de franjas (5.2) son estrictas? ¿Qué pasa con urgencias de guardia fuera de grilla?
6. ¿Qué canal usan los servicios para recibir avisos: email institucional, WhatsApp, teléfono interno?
7. ¿SAMCo expone una API o base para consultar pacientes (DNI, HC, obra social)?
8. ¿Se agregan los camilleros como rol con su propia vista?
9. ¿Cuánto tiempo vence una orden sin turno?

## 12. Cómo quiero que trabajes
1. Hacé la Fase 0 y confirmame la URL.
2. Devolveme: arquitectura propuesta, esquema de base de datos, lista de pantallas y un plan de tareas para la Fase 1, con tus dudas.
3. Esperá mi confirmación antes de implementar.
4. Mantené el comportamiento de `prototype/index.html` como referencia; si cambiás una regla, explicá por qué.
5. Escribí tests para las reglas de la sección 5 (especialmente franjas y doble reserva) y para los permisos por rol.
6. Todo el texto de la interfaz en español (Argentina).
