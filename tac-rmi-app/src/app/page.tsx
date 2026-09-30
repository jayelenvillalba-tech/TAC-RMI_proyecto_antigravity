"use client";

import React, { useEffect, useState } from "react";
import { 
  Activity, Calendar, FileText, Plus, Users, Bed, ShieldAlert, ArrowLeft, RefreshCw
} from "lucide-react";

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState<string>("secretaria");
  const [tab, setTab] = useState<string>("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Estados modal de turno
  const [modalTurnoOpen, setModalTurnoOpen] = useState(false);
  const [fechaTurno, setFechaTurno] = useState<string>(new Date().toISOString().slice(0, 10));
  const [franjasDisponibles, setFranjasDisponibles] = useState<any[]>([]);
  const [franjaReq, setFranjaReq] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Formulario nueva orden
  const [form, setForm] = useState({
    tipoSolicitud: "TC",
    tipoPaciente: "Ambulatorio",
    pacienteNombre: "",
    pacienteDni: "",
    pacienteHc: "",
    pacienteEdad: "",
    peso: "",
    sala: "",
    cama: "",
    servicioNombre: "Cirugía",
    medicoSolicitante: "Dr. Solicitante General",
    matricula: "MP 19842",
    procedencia: "CONS_EXTERNO",
    estudio1: "TC de Tórax",
    estudio2: "",
    contraste: false,
    anestesia: false,
    motivo: "Evaluación clínica e imágenes",
    diagnosticoPresuntivo: "",
    observaciones: "",
    antRenal: false,
    antRenalCual: "",
    antAsma: false,
    antClaustrofobia: false,
    antImplantes: false,
    antImplantesCuales: "",
    antRmPrevia: false,
    antRmFecha: "",
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.antImplantes && !form.antImplantesCuales.trim()) {
      alert("Para pacientes con implantes metálicos debe detallar material y compatibilidad");
      return;
    }
    if (form.tipoPaciente === "Internado" && (!form.sala || !form.cama)) {
      alert("Para internados, Sala y Cama son obligatorias");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Error al crear la orden: " + err.error);
        return;
      }
      alert("✅ Orden médica guardada exitosamente en la base de datos");
      await fetchOrders();
      setTab("dashboard");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const abrirModalTurno = async (orden: any) => {
    setSelectedOrder(orden);
    setModalTurnoOpen(true);
    consultarSlots(orden.id, fechaTurno);
  };

  const consultarSlots = async (orderId: string, fecha: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/slots?orderId=${orderId}&fecha=${fecha}`);
      const data = await res.json();
      setFranjasDisponibles(data.disponibles || []);
      setFranjaReq(data.franjaRequerida);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlots(false);
    }
  };

  const asignarTurno = async (hora: string, tipoFranja: string) => {
    if (!selectedOrder) return;
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          modalidad: selectedOrder.tipoSolicitud === "RM" ? "RM" : "TC",
          fecha: fechaTurno,
          hora,
          tipoFranja,
          usuario: rol.toUpperCase(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert("⚠️ No se pudo asignar: " + err.error);
        return;
      }

      alert(`✅ Turno asignado con éxito para el ${fechaTurno} a las ${hora} hs`);
      setModalTurnoOpen(false);
      await fetchOrders();
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const ambulatorios = orders.filter(o => o.tipoPaciente === "Ambulatorio");
  const internados = orders.filter(o => o.tipoPaciente === "Internado");
  const pendientes = orders.filter(o => o.estado === "Pendiente");
  const conTurno = orders.filter(o => o.estado === "Turno asignado");

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Header Superior */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-primary text-white p-5 rounded-2xl shadow-md mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-wide flex items-center gap-2">
            🏥 SDI — H.E. Eva Perón
          </h1>
          <p className="text-xs text-blue-100 font-medium">
            Servicio de Diagnóstico por Imágenes · Gestión Real de Órdenes y Turnos TC/RM
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl border border-white/20 self-start md:self-auto">
          <label className="text-xs font-semibold">Rol Activo:</label>
          <select 
            value={rol} 
            onChange={(e) => setRol(e.target.value)}
            className="bg-primary-dark text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/30 outline-none"
          >
            <option value="medico">Médico de Servicio</option>
            <option value="secretaria">Secretaría (Ambulatorios)</option>
            <option value="sala">Sala de Médicos (Internados)</option>
            <option value="anestesia">Anestesiología</option>
            <option value="admin">Administrador / Jefe DxI</option>
          </select>
        </div>
      </header>

      {/* Navegación por pestañas */}
      <nav className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-3 mb-6">
        <button 
          onClick={() => { setTab("dashboard"); setSelectedOrder(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition ${tab === "dashboard" ? "bg-primary text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100"}`}
        >
          <Activity size={16} /> Inicio
        </button>
        <button 
          onClick={() => { setTab("nueva"); setSelectedOrder(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition ${tab === "nueva" ? "bg-primary text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100"}`}
        >
          <Plus size={16} /> Nueva Orden
        </button>
        <button 
          onClick={() => { setTab("ambulatorios"); setSelectedOrder(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition ${tab === "ambulatorios" ? "bg-primary text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100"}`}
        >
          <Users size={16} /> Ambulatorios ({ambulatorios.filter(o => o.estado === "Pendiente").length})
        </button>
        <button 
          onClick={() => { setTab("internados"); setSelectedOrder(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition ${tab === "internados" ? "bg-primary text-white shadow" : "bg-white text-slate-600 hover:bg-slate-100"}`}
        >
          <Bed size={16} /> Internados ({internados.filter(o => o.estado === "Pendiente").length})
        </button>
      </nav>

      {/* Vistas Principales */}
      {selectedOrder ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft size={16} /> Volver al listado
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${selectedOrder.estado === "Turno asignado" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
              {selectedOrder.estado}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">{selectedOrder.pacienteNombre}</h2>
                <p className="text-xs font-semibold text-slate-500">
                  DNI: {selectedOrder.pacienteDni} · HC: {selectedOrder.pacienteHc || "S/D"} · Edad: {selectedOrder.pacienteEdad || "-"} años
                </p>
                <p className="text-xs font-bold text-primary mt-1">
                  Servicio: {selectedOrder.servicioNombre} · {selectedOrder.tipoPaciente} 
                  {selectedOrder.tipoPaciente === "Internado" && ` (Sala: ${selectedOrder.sala} - Cama: ${selectedOrder.cama})`}
                </p>
              </div>

              {selectedOrder.antImplantes && (
                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-xl text-xs text-red-900">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <ShieldAlert size={18} className="text-red-600" /> ALERTA DE IMPLANTE METÁLICO
                  </div>
                  <p className="mt-1">
                    Requiere constancia física firmada de compatibilidad. Material: <strong>{selectedOrder.antImplantesCuales}</strong>
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100 text-xs">
                <div><strong>Estudio Solicitado:</strong> {selectedOrder.estudio1}</div>
                <div><strong>Motivo Clínico:</strong> {selectedOrder.motivo}</div>
                <div><strong>Contraste EV:</strong> {selectedOrder.contraste ? "Sí" : "No"} · <strong>Anestesia:</strong> {selectedOrder.anestesia ? "Sí" : "No"}</div>
                <div><strong>Médico Solicitante:</strong> {selectedOrder.medicoSolicitante} ({selectedOrder.matricula || "S/M"})</div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 self-start">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Acciones</h3>
              {selectedOrder.estado === "Pendiente" && (
                <button 
                  onClick={() => abrirModalTurno(selectedOrder)}
                  className="w-full bg-primary text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow hover:bg-primary-dark transition"
                >
                  <Calendar size={16} /> Asignar Turno Grilla
                </button>
              )}
              <a 
                href={`/api/orders/${selectedOrder.id}/pdf`} 
                target="_blank"
                rel="noreferrer"
                className="w-full bg-white text-slate-700 border border-slate-300 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition"
              >
                <FileText size={16} /> Ver Form 599 PDF Oficial
              </a>
            </div>
          </div>
        </div>
      ) : tab === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-primary">{pendientes.length}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Pendientes</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-green-600">{conTurno.length}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Con Turno</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-amber-600">{internados.length}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Internados</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-purple-600">{orders.filter(o => o.anestesia).length}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Anestesia</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase text-slate-700 tracking-wider">Órdenes en Base de Datos ({orders.length})</h2>
              <button onClick={fetchOrders} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">Cargando órdenes desde Supabase...</div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">No hay órdenes. Ingrese a "Nueva Orden".</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <div 
                    key={o.id} 
                    onClick={() => setSelectedOrder(o)}
                    className="py-3 px-2 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 rounded-xl cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{o.pacienteNombre}</span>
                        <span className="text-xs text-slate-400 font-medium">DNI {o.pacienteDni}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">
                        {o.estudio1} · <span className="text-primary">{o.servicioNombre}</span> ({o.tipoPaciente})
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      {o.antImplantes && <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">IMPLANTE</span>}
                      {o.anestesia && <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full">ANESTESIA</span>}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${o.estado === "Turno asignado" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {o.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : tab === "nueva" ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-1">Cargar Nueva Orden Digital</h2>
          <p className="text-xs text-slate-500 mb-6">Equivalente directo del Formulario 599 con guardado en Supabase</p>

          <form onSubmit={handleCrearOrden} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Solicitud *</label>
                <select 
                  value={form.tipoSolicitud}
                  onChange={(e) => setForm({ ...form, tipoSolicitud: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="TC">Tomografía Computada (TC)</option>
                  <option value="RM">Resonancia Magnética (RM)</option>
                  <option value="PUNCION">Punción guiada por TC</option>
                  <option value="DRENAJE">Drenaje guiado por TC</option>
                  <option value="ETE">Ecocardiograma Transesofágico (ETE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Paciente *</label>
                <select 
                  value={form.tipoPaciente}
                  onChange={(e) => setForm({ ...form, tipoPaciente: e.target.value })}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Ambulatorio">Ambulatorio</option>
                  <option value="Internado">Internado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Servicio Solicitante *</label>
                <select 
                  value={form.servicioNombre}
                  onChange={(e) => {
                    const serv = e.target.value;
                    if (serv === "Guardia") {
                      setForm({ ...form, servicioNombre: serv, tipoPaciente: "Internado", sala: "Guardia" });
                    } else {
                      setForm({ ...form, servicioNombre: serv });
                    }
                  }}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Cirugía">Cirugía</option>
                  <option value="Clínica Médica">Clínica Médica</option>
                  <option value="Guardia">Guardia (Fuerza Internado)</option>
                  <option value="Traumatología">Traumatología</option>
                  <option value="Neurología">Neurología</option>
                  <option value="Pediatría">Pediatría</option>
                  <option value="Ginecología">Ginecología</option>
                </select>
              </div>
            </div>

            {form.tipoPaciente === "Internado" && (
              <div className="grid grid-cols-2 gap-4 bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Sala / Pabellón *</label>
                  <input 
                    type="text" 
                    value={form.sala}
                    onChange={(e) => setForm({ ...form, sala: e.target.value })}
                    required
                    placeholder="Ej: Sala 3"
                    className="w-full text-xs p-2.5 rounded-lg border border-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Cama *</label>
                  <input 
                    type="text" 
                    value={form.cama}
                    onChange={(e) => setForm({ ...form, cama: e.target.value })}
                    required
                    placeholder="Ej: 12B"
                    className="w-full text-xs p-2.5 rounded-lg border border-amber-300"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Apellido y Nombre *</label>
                <input 
                  type="text" 
                  value={form.pacienteNombre}
                  onChange={(e) => setForm({ ...form, pacienteNombre: e.target.value })}
                  required
                  placeholder="Ej: PEREZ, JUAN"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">DNI *</label>
                <input 
                  type="text" 
                  value={form.pacienteDni}
                  onChange={(e) => setForm({ ...form, pacienteDni: e.target.value })}
                  required
                  placeholder="XX.XXX.XXX"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Historia Clínica</label>
                <input 
                  type="text" 
                  value={form.pacienteHc}
                  onChange={(e) => setForm({ ...form, pacienteHc: e.target.value })}
                  placeholder="HC-12345"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estudio Solicitado *</label>
                <input 
                  type="text" 
                  value={form.estudio1}
                  onChange={(e) => setForm({ ...form, estudio1: e.target.value })}
                  required
                  placeholder="Ej: RM de Encéfalo"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo Clínico *</label>
                <input 
                  type="text" 
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  required
                  placeholder="Diagnóstico presuntivo"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.contraste}
                  onChange={(e) => setForm({ ...form, contraste: e.target.checked })}
                /> Contraste EV
              </label>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.anestesia}
                  onChange={(e) => setForm({ ...form, anestesia: e.target.checked })}
                /> Anestesia
              </label>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.antAsma}
                  onChange={(e) => setForm({ ...form, antAsma: e.target.checked })}
                /> Asma / Alergia
              </label>

              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.antImplantes}
                  onChange={(e) => setForm({ ...form, antImplantes: e.target.checked })}
                /> 🔴 Implante Metálico
              </label>
            </div>

            {form.antImplantes && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <label className="block text-xs font-bold text-red-900 mb-1">
                  Detalle del Implante Metálico *
                </label>
                <input 
                  type="text" 
                  value={form.antImplantesCuales}
                  onChange={(e) => setForm({ ...form, antImplantesCuales: e.target.value })}
                  required
                  placeholder="Ej: Stent carotídeo 2021 compatible 1.5T"
                  className="w-full text-xs p-2.5 rounded-lg border border-red-300"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setTab("dashboard")}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-primary text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow hover:bg-primary-dark transition"
              >
                💾 Guardar Orden en Base de Datos
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-base font-black text-slate-800 mb-4">Listado de Órdenes Filtradas</h2>
          <div className="divide-y divide-slate-100">
            {(tab === "ambulatorios" ? ambulatorios : internados).map(o => (
              <div key={o.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{o.pacienteNombre} (DNI {o.pacienteDni})</div>
                  <div className="text-xs text-slate-500">{o.estudio1} · {o.servicioNombre} {o.tipoPaciente === "Internado" && `(Sala ${o.sala} / Cama ${o.cama})`}</div>
                </div>
                <button onClick={() => setSelectedOrder(o)} className="text-xs font-bold text-primary hover:underline">
                  Gestionar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Turno */}
      {modalTurnoOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-black text-slate-900 mb-1">Asignar Turno en Grilla Real</h3>
            <p className="text-xs text-slate-500 mb-4">
              Paciente: <strong>{selectedOrder.pacienteNombre}</strong> ({selectedOrder.tipoPaciente})
            </p>

            <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs mb-4 text-blue-900">
              Modalidad: <strong>{selectedOrder.tipoSolicitud === "RM" ? "RM" : "TC"}</strong> · Franja Requerida: <strong>{franjaReq || "Libre"}</strong>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar Fecha:</label>
              <input 
                type="date" 
                value={fechaTurno}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  setFechaTurno(e.target.value);
                  consultarSlots(selectedOrder.id, e.target.value);
                }}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">Franjas Disponibles para {fechaTurno}:</div>
              {loadingSlots ? (
                <div className="text-center py-6 text-xs text-slate-400 font-bold">Consultando base de datos...</div>
              ) : franjasDisponibles.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-bold bg-slate-50 rounded-xl">
                  No hay franjas libres que coincidan en esta fecha.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {franjasDisponibles.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => asignarTurno(f.hora, f.franja)}
                      className="p-2 border border-slate-200 rounded-xl text-center hover:bg-primary hover:text-white hover:border-primary transition group"
                    >
                      <div className="text-xs font-black">{f.hora} hs</div>
                      <div className="text-[9px] text-slate-400 group-hover:text-blue-100 truncate">{f.franja}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setModalTurnoOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
