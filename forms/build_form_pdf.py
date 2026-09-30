from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color, black, HexColor
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY

W, H = A4
M = 40
FILL = Color(0.92, 0.95, 1, 1)
c = canvas.Canvas("Formulario_599_TAC-RMI_completable.pdf", pagesize=A4)
c.setTitle("Form 599 - Sección Tomografía y Resonancia Magnética")
af = c.acroForm
def Y(t): return H - t

def label(x, t, txt, bold=True, size=8):
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, Y(t), txt)
    return x + c.stringWidth(txt, "Helvetica-Bold" if bold else "Helvetica", size)

def tf(name, x, t, w, h=13, multiline=False, tip=None, maxlen=None):
    """text field whose baseline is at top-offset t (underline drawn)"""
    c.setStrokeColor(black); c.setLineWidth(0.6)
    if not multiline:
        c.line(x, Y(t) - 2, x + w, Y(t) - 2)
    kw = dict(name=name, tooltip=tip or name, x=x, y=(Y(t) - h) if multiline else Y(t) - 2, width=w, height=h,
              borderWidth=0, fillColor=FILL, textColor=black, fontSize=9,
              forceBorder=False)
    if multiline:
        kw.update(fieldFlags='multiline', borderWidth=0.6, borderColor=black)
    if maxlen: kw['maxlen'] = maxlen
    af.textfield(**kw)

def radio(group, value, x, t, size=11):
    af.radio(name=group, tooltip=f"{group}: {value}", value=value, selected=False,
             x=x, y=Y(t) - 2, size=size, buttonStyle='check', shape='square',
             borderColor=black, fillColor=FILL, borderWidth=1, forceBorder=True)

def yesno(group, x, t):
    """SÍ / NO radio pair, returns x end"""
    x = label(x, t, "SÍ", size=8) + 3
    radio(group, "SI", x, t); x += 18
    x = label(x, t, "NO", size=8) + 3
    radio(group, "NO", x, t); return x + 14

# ================= PÁGINA 1 =================
# Encabezado
c.setFont("Helvetica-Bold", 7); c.setFillColor(black)
c.setStrokeColor(black); c.setLineWidth(1)
c.rect(M, Y(78), 78, 46)
c.setFont("Helvetica-Bold", 6.5)
c.drawCentredString(M+39, Y(50), "HOSPITAL ESCUELA")
c.setFont("Helvetica-Bold", 9); c.drawCentredString(M+39, Y(62), "EVA PERÓN")
c.setFont("Helvetica", 5.5); c.drawCentredString(M+39, Y(71), "GRANADERO BAIGORRIA")
c.setFont("Helvetica-Bold", 12)
c.drawString(M+90, Y(50), "SERVICIO")
c.drawString(M+90, Y(66), "DIAGNÓSTICO POR IMÁGENES")
c.circle(M+330, Y(56), 22); c.setFont("Helvetica-Bold", 13); c.drawCentredString(M+330, Y(60), "DxI")
bx = W - M - 150
c.rect(bx, Y(80), 150, 50)
c.setFont("Helvetica-Bold", 8); c.drawCentredString(bx+75, Y(41), "INTERNACIÓN")
c.line(bx, Y(46), bx+150, Y(46)); c.line(bx, Y(63), bx+150, Y(63))
label(bx+4, 58, "SALA:"); tf("sala", bx+36, 58, 110)
label(bx+4, 75, "CAMA:"); tf("cama", bx+36, 75, 110)

c.setFont("Helvetica-Bold", 12)
t = "SECCIÓN TOMOGRAFÍA Y RESONANCIA MAGNÉTICA"
c.drawCentredString(W/2, Y(104), t)
tw = c.stringWidth(t, "Helvetica-Bold", 12)
c.line(W/2-tw/2, Y(106), W/2+tw/2, Y(106))

# Paciente
x = label(M, 124, "PACIENTE:"); c.line(M, Y(126), x, Y(126))
label(W-M-190, 124, "FECHA:"); tf("fecha", W-M-150, 124, 110, tip="Fecha (dd/mm/aaaa)", maxlen=10)
x = label(M, 142, "APELLIDO Y NOMBRE:") + 4; tf("apellido_nombre", x, 142, 200)
x2 = label(M+330, 142, "H.C.:") + 4; tf("hc", x2, 142, W-M-x2)
x = label(M, 164, "DNI/LC/LE/CI:") + 4; tf("dni", x, 164, 90)
x = label(M+185, 164, "F.N.:") + 4; tf("fn", x, 164, 70, tip="Fecha de nacimiento (dd/mm/aaaa)", maxlen=10)
x = label(M+300, 164, "EDAD:") + 4; tf("edad", x, 164, 45)
x = label(M+400, 164, "PESO:") + 4; tf("peso", x, 164, W-M-x)
x = label(M, 186, "DOMICILIO:") + 4; tf("domicilio", x, 186, 170)
x = label(M+265, 186, "LOCALIDAD:") + 4; tf("localidad", x, 186, 100)
x = label(M+430, 186, "TE:") + 4; tf("telefono", x, 186, W-M-x)
x = label(M, 208, "OBRA SOCIAL:") + 4; tf("obra_social", x, 208, W-M-x)

# Procedencia (radio)
x = M
for lab, val in [("GUARDIA", "GUARDIA"), ("INTERNACIÓN", "INTERNACION"),
                 ("CONS. EXTERNO", "CONS_EXTERNO"), ("OTROS ESTABLECIMIENTOS", "OTROS")]:
    x = label(x, 232, lab) + 4
    radio("procedencia", val, x, 232); x += 30

# Solicitante
x = label(M, 256, "SOLICITANTE:"); c.line(M, Y(258), x, Y(258))
x = label(M, 272, "SERVICIO:") + 4; tf("servicio", x, 272, 200)
x = label(M+300, 272, "EFECTOR:") + 4; tf("efector", x, 272, W-M-x)
x = label(M, 294, "MÉDICO SOLICITANTE:") + 4; tf("medico_solicitante", x, 294, 230)
x = label(M+330, 294, "N° MATRÍCULA:") + 4; tf("matricula", x, 294, W-M-x)
x = label(M, 316, "SOLICITA ESTUDIO DE:"); c.line(M, Y(318), x, Y(318))
x += 4; tf("estudio_1", x, 316, W-M-x); tf("estudio_2", M, 334, W-2*M)

# Contraste / anestesia
x = label(M, 358, "CONTRASTE:") + 6; yesno("contraste", x, 358)
x = label(M+330, 358, "ANESTESIA:") + 6; yesno("anestesia", x, 358)

# Motivo
label(M, 380, "MOTIVO DE LA SOLICITUD:")
tf("motivo", M+130, 371, W-M-(M+130), h=42, multiline=True, tip="Motivo de la solicitud")

# Exámenes previos
x = label(M, 444, "EXÁMENES PREVIOS:") + 6; yesno("examenes_previos", x, 444)
x = label(M, 466, "DIAGNÓSTICO PRESUNTIVO:") + 4; tf("diagnostico_presuntivo", x, 466, W-M-x)

# ---- Antecedentes (ancho completo) ----
top = 480
c.setLineWidth(1)
c.setFillColor(HexColor("#e6e6e6")); c.rect(M, Y(top+16), W-2*M, 16, fill=1); c.setFillColor(black)
c.setFont("Helvetica-Bold", 8.5)
c.drawCentredString(W/2, Y(top+11.5), "MÉDICO SOLICITANTE  —  IMPORTANTE COMPLETAR ANTECEDENTES")

qstyle = ParagraphStyle("q", fontName="Helvetica", fontSize=8.5, leading=10.5)
warn = ParagraphStyle("w", fontName="Helvetica", fontSize=7.8, leading=9.6)
note = ParagraphStyle("n", fontName="Helvetica-Oblique", fontSize=7.8, leading=9.6)
QW = 300           # ancho de la columna de preguntas
RX = M + QW + 8    # inicio columna de respuestas

rows = []
y = top + 16
def row(height, qtext, group, extra=None):
    global y
    c.setLineWidth(0.6); c.rect(M, Y(y+height), W-2*M, height)
    p = Paragraph(qtext, qstyle); pw, ph = p.wrap(QW, 100)
    p.drawOn(c, M+5, Y(y + (height-ph)/2 + ph if height < 40 else y + 6 + ph))
    baseline = y + 15
    yesno(group, RX, baseline)
    if extra: extra(y, baseline)
    y += height

def cual_field(lbl, name, w=None):
    def f(yy, base):
        x = label(RX+90, base, lbl, size=8) + 4
        tf(name, x, base, W-M-8-x)
    return f

row(24, "¿Tiene Usted enfermedad renal? ¿Cuál?", "ant_renal", cual_field("¿Cuál?", "ant_renal_cual"))
row(24, "¿Tiene Usted asma o severos antecedentes de alergias?", "ant_asma")
row(24, "¿Tiene Usted síntomas de claustrofobia?", "ant_claustrofobia")

# Pregunta 4 (con "¿Cuáles?" y aviso)
h4 = 92
c.rect(M, Y(y+h4), W-2*M, h4)
p = Paragraph("¿Tiene Usted marcapasos, válvulas cardíacas, audífonos, clips, implantes cocleares u otros implantes metálicos?", qstyle)
pw, ph = p.wrap(QW, 100); p.drawOn(c, M+5, Y(y+6+ph))
yesno("ant_implantes", RX, y+15)
x = label(RX+90, y+15, "¿Cuáles?", size=8) + 4; tf("ant_implantes_cuales", x, y+15, W-M-8-x)
# recuadro de advertencia
wx, wy, ww, wh = M+5, y+30, W-2*M-10, 58
c.setStrokeColor(HexColor("#b00000")); c.setLineWidth(1.4); c.setFillColor(HexColor("#fff3f3"))
c.rect(wx, Y(wy+wh), ww, wh, fill=1); c.setFillColor(black); c.setStrokeColor(black)
wp = Paragraph("<b><font color='#b00000'>REQUISITO FUNDAMENTAL:</font></b> es indispensable traer el <b>formato físico o fotocopia</b> "
               "que muestre <b>qué tipo de material</b> se le colocó y deje constancia de que el diagnóstico es "
               "<b>compatible y seguro para el resonador</b>, con <b>firma y sello del médico tratante</b>. "
               "<b>Caso contrario, el estudio NO se realizará.</b>", warp := ParagraphStyle("ww", parent=warn, fontSize=8.2, leading=10.6))
pw, ph = wp.wrap(ww-12, 100); wp.drawOn(c, wx+6, Y(wy + (wh-ph)/2 + ph))
y += h4

# Pregunta 5
h5 = 44
c.setLineWidth(0.6); c.rect(M, Y(y+h5), W-2*M, h5)
p = Paragraph("¿Usted se ha realizado anteriormente un estudio de RM? ¿En qué fecha?", qstyle)
pw, ph = p.wrap(QW, 100); p.drawOn(c, M+5, Y(y+6+ph))
yesno("ant_rm_previa", RX, y+15)
x = label(RX+90, y+15, "Fecha:", size=8) + 4; tf("ant_rm_fecha", x, y+15, 80, tip="Fecha de RM previa (dd/mm/aaaa)", maxlen=10)
np_ = Paragraph("<i>Se recomienda traer los estudios previos.</i>", note)
pw, ph = np_.wrap(W-2*M-10, 40); np_.drawOn(c, M+5, Y(y+h5-6))
y += h5

# Observaciones
y += 8
label(M, y+9, "OBSERVACIONES MÉDICAS DEL SERVICIO:")
oh = 806 - 30 - (y+14)
tf("observaciones", M, y+14, W-2*M, h=oh, multiline=True, tip="Observaciones médicas del servicio")
print("obs top", y+14, "height", oh)

# Firma
fy = 812
c.line(M+40, Y(fy), M+230, Y(fy))
c.setFont("Helvetica-Bold", 7.5)
c.drawCentredString(M+135, Y(fy+9), "MÉDICO SOLICITANTE — FIRMA Y SELLO")
c.drawRightString(W-M, Y(fy+9), "FORM 599")
c.showPage()

# ================= PÁGINA 2: CONSENTIMIENTO =================
c.setFont("Helvetica-Bold", 15)
t = "HOSPITAL ESCUELA EVA PERÓN"
c.drawCentredString(W/2, Y(58), t); tw = c.stringWidth(t, "Helvetica-Bold", 15)
c.line(W/2-tw/2, Y(61), W/2+tw/2, Y(61))
c.setFont("Helvetica-Bold", 12)
t = "CONSENTIMIENTO INFORMADO"; c.drawCentredString(W/2, Y(84), t); tw = c.stringWidth(t, "Helvetica-Bold", 12)
c.line(W/2-tw/2, Y(86), W/2+tw/2, Y(86))
c.setFont("Helvetica", 8.5)
c.drawCentredString(W/2, Y(99), "PARA LA ADMINISTRACIÓN DE LA SUSTANCIA DE CONTRASTE")

for i, (lab, nm) in enumerate([("Paciente:", "cons_paciente"), ("Estudio:", "cons_estudio"), ("Médico a cargo:", "cons_medico")]):
    yy = 128 + i*20
    x = label(M+10, yy, lab, bold=False, size=9.5) + 4; tf(nm, x, yy, W-M-x, tip=lab)

body = ParagraphStyle("b", fontName="Helvetica", fontSize=9, leading=11.6, alignment=TA_JUSTIFY, spaceAfter=4)
bul = ParagraphStyle("bl", parent=body, leftIndent=34, bulletIndent=20, spaceAfter=1.5)
par = [
 "Su médico le ha pedido un estudio que requiere la administración de una sustancia de contraste yodado si el estudio es una tomografía o paramagnético si el estudio es una resonancia. El agente de contraste se muestra como una imagen blanca en los estudios realizados con rayos X, y permite que el radiólogo los pueda interpretar adecuadamente. Normalmente el agente de contraste es considerado bastante seguro, sin embargo, si se inyecta implica cierto riesgo como la posibilidad de daño a un nervio, arteria, vena, piel, tejidos subdérmicos, infección o reacción al agente inyectado. Ocasionalmente con la administración del agente de contraste algún paciente puede desarrollar una reacción moderada que le provocará estornudo o urticaria; con poca frecuencia (1 de cada 1.000 casos) se puede producir una reacción severa (dificultad respiratoria, arritmias, convulsiones, falla renal o pérdida del conocimiento).",
 "Los médicos y el personal del área de Diagnóstico por Imágenes están entrenados para detectar estas reacciones y actuar en consecuencia.",
 "Alguna vez ha ocurrido la muerte del paciente en relación con la administración de contraste (1 caso cada 40.000). El riesgo de esta posibilidad es similar al de la inyección de penicilina. Las cifras aquí mencionadas corresponden a estadísticas realizadas en adultos.",
 "Los pacientes que tienen mayor riesgo de experimentar reacciones a agentes de contraste yodado o paramagnético del tipo gadolíneo son:",
]
bullets = ["Los que ya han tenido reacciones de tipo alérgico desencadenadas por agentes de contraste y que hayan requerido tratamiento.",
 "Los que padecen asma o alergia severa.",
 "Los que tienen enfermedad cardíaca severa, particularmente con insuficiencia cardíaca.",
 "Los que tienen policitemia, feocromocitoma o mieloma múltiple.",
 "Los que tienen insuficiencia renal severa."]
par2 = [
 "Si Ud. cree encontrarse en una de estas categorías de mayor riesgo <b><u>por favor infórmelo para ayudar a planificar la premedicación y la elección de material de contraste en forma individualizada.</u></b>",
 "Para los estudios que exigen la administración intravenosa o intra arterial del agente de contraste en pacientes con antecedentes se requerirá <b>premedicación anterior a la realización del estudio</b>.",
 "Entiendo y acepto que las imágenes de Diagnóstico por Imagen pueden ser utilizadas en informes médicos, Estudios Clínicos o investigación con mi diagnóstico y tratamiento. Las imágenes serán utilizadas de forma anónima.",
]
yy = 200
def put(p, w=W-2*M-20):
    global yy
    pw, ph = p.wrap(w, 500); p.drawOn(c, M+10, Y(yy+ph)); yy += ph + p.getSpaceAfter()
for s in par: put(Paragraph(s, body))
for s in bullets: put(Paragraph(s, bul, bulletText="•"))
yy += 4
for s in par2: put(Paragraph(s, body))

yy += 14
c.setFont("Helvetica-Bold", 10)
c.drawString(M+10, Y(yy), "HE LEÍDO LA INFORMACIÓN DETALLADA ARRIBA Y MIS PREGUNTAS HAN SIDO RESPONDIDAS.")
yy += 22
x = label(M+10, yy, "AUTORIZO LA ADMINISTRACIÓN DE SUSTANCIAS DE CONTRASTE:", size=10) + 6
x = label(x, yy, "SÍ", size=10) + 4; radio("cons_autoriza", "SI", x, yy, size=13); x += 24
x = label(x, yy, "NO", size=10) + 4; radio("cons_autoriza", "NO", x, yy, size=13)

yy += 44
x = label(M+10, yy, "Fecha:", bold=False, size=9.5) + 6; tf("cons_fecha", x, yy, 100, tip="Fecha (dd/mm/aaaa)", maxlen=10)
yy += 30
c.setFont("Helvetica", 9.5); c.drawString(M+10, Y(yy), "Firma (paciente / familiar):")
c.line(M+150, Y(yy)-2, M+340, Y(yy)-2)
c.setFont("Helvetica-Oblique", 7); c.setFillColor(HexColor("#666666"))
c.drawString(M+150, Y(yy)-11, "(firmar a mano o con lápiz digital / tablet)"); c.setFillColor(black)
yy += 30
x = label(M+10, yy, "Aclaración:", bold=False, size=9.5) + 4; tf("cons_aclaracion", x, yy, 300)
yy += 24
x = label(M+10, yy, "Tipo y N° de Documento:", bold=False, size=9.5) + 4; tf("cons_documento", x, yy, 200)
c.showPage()
c.save()
