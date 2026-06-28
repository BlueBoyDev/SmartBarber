"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar, CheckCircle, Clock, XCircle, LogOut,
  RefreshCw, MapPin, Star, Scissors, PlayCircle, User,
  ChevronLeft, ChevronRight, Settings, Lock, Unlock
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Cliente { id: string; nombre: string; telefono: string; }
interface Servicio { id: string; nombre: string; duracion_min: number; precio: number; }
interface Cita {
  id: string; fecha_hora: string;
  estado: 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada';
  notas: string | null; cliente: Cliente | null; servicio: Servicio | null;
}
interface BarberoProfile {
  id: string; descripcion: string; rating_promedio: number;
  direccion: string; activo: boolean;
}
interface JornadaDia {
  id?: string; dia_semana: number;
  hora_inicio: string; hora_fin: string; activo: boolean;
}
interface Bloqueo {
  id: string; fecha: string;
  hora_inicio: string | null; hora_fin: string | null; motivo: string | null;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_FULL   = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const JORNADA_DEFAULT: JornadaDia[] = DIAS_SEMANA.map((_, i) => ({
  dia_semana: i,
  hora_inicio: '09:00',
  hora_fin: '19:00',
  activo: i !== 0, // domingos desactivados por defecto
}));

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',   color: '#f1c40f', bg: 'rgba(241,196,15,0.15)' },
  confirmada: { label: 'Confirmada',  color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
  en_curso:   { label: 'En curso',    color: '#3498db', bg: 'rgba(52,152,219,0.15)' },
  completada: { label: 'Completada',  color: '#95a5a6', bg: 'rgba(149,165,166,0.15)' },
  cancelada:  { label: 'Cancelada',   color: '#e74c3c', bg: 'rgba(231,76,60,0.15)' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHora(fechaISO: string) {
  return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatFecha(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}
function mesLabel(anio: number, mes: number) {
  return new Date(anio, mes, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}
function diasDelMes(anio: number, mes: number): Date[] {
  const dias: Date[] = [];
  const total = new Date(anio, mes + 1, 0).getDate();
  for (let d = 1; d <= total; d++) dias.push(new Date(anio, mes, d));
  return dias;
}
function pad(n: number) { return String(n).padStart(2, '0'); }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function generarSlots(horaInicio: string, horaFin: string): string[] {
  const slots: string[] = [];
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  let mins = hI * 60 + mI;
  const finMins = hF * 60 + mF;
  while (mins < finMins) {
    slots.push(`${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`);
    mins += 30;
  }
  return slots;
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // — Estado global —
  const [tab, setTab] = useState<'citas' | 'horarios' | 'servicios'>('citas');
  const [citas, setCitas] = useState<Cita[]>([]);
  const [barbero, setBarbero] = useState<BarberoProfile | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(''); // Vacío significa "todas"

  // — Horarios —
  const [jornada, setJornada] = useState<JornadaDia[]>(JORNADA_DEFAULT);
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [mesActual, setMesActual] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [guardandoJornada, setGuardandoJornada] = useState(false);
  const [bloqueandoSlot, setBloqueandoSlot] = useState<string | null>(null);

  // — Perfil Editar —
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [nuevoPerfil, setNuevoPerfil] = useState({ nombre: '', direccion: '', descripcion: '' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // — Servicios —
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [editandoServicio, setEditandoServicio] = useState<Servicio | null>(null);
  const [nuevoServicio, setNuevoServicio] = useState({ nombre: '', duracion_min: 30, precio: 100 });

  // ─ Auth guard ─
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.tipo !== 'barbero')) router.push('/');
  }, [isLoading, isAuthenticated, user, router]);

  // ─ Perfil ─
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/barbero/perfil?usuario_id=${user.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setBarbero(data.barbero); })
      .catch(() => setError('Error al cargar perfil del barbero.'));
  }, [user?.id]);

  // ─ Citas ─
  const cargarCitas = useCallback(async () => {
    if (!barbero?.id) return;
    setCargando(true); setError('');
    try {
      const fechaQuery = fechaSeleccionada === '' ? 'todas' : fechaSeleccionada;
      const res = await fetch(`/api/barbero/citas?barbero_id=${barbero.id}&fecha=${fechaQuery}`);
      const data = await res.json();
      if (data.success) setCitas(data.citas);
      else setError(data.error || 'Error al cargar citas.');
    } catch { setError('Error de conexión.'); }
    finally { setCargando(false); }
  }, [barbero?.id, fechaSeleccionada]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  // ─ Horarios: cargar jornada + bloqueos del mes ─
  const cargarHorarios = useCallback(async () => {
    if (!barbero?.id) return;
    const mesStr = `${mesActual.getFullYear()}-${pad(mesActual.getMonth() + 1)}`;
    const res = await fetch(`/api/barbero/horarios?barbero_id=${barbero.id}&mes=${mesStr}`);
    const data = await res.json();
    if (data.success) {
      if (data.jornadaBase.length > 0) {
        // Combinar con defaults para días faltantes
        const map = Object.fromEntries(data.jornadaBase.map((j: JornadaDia) => [j.dia_semana, j]));
        setJornada(JORNADA_DEFAULT.map((def) => map[def.dia_semana] ?? def));
      }
      setBloqueos(data.bloqueos ?? []);
    }
  }, [barbero?.id, mesActual]);

  useEffect(() => { if (tab === 'horarios') cargarHorarios(); }, [tab, cargarHorarios]);

  // ─ Servicios: cargar lista ─
  const cargarServicios = useCallback(async () => {
    if (!barbero?.id) return;
    setCargandoServicios(true);
    try {
      const res = await fetch(`/api/barbero/servicios?barbero_id=${barbero.id}`);
      const data = await res.json();
      if (data.success) setServicios(data.servicios);
      else setError(data.error || 'Error al cargar servicios.');
    } catch { setError('Error de conexión.'); }
    finally { setCargandoServicios(false); }
  }, [barbero?.id]);

  useEffect(() => { if (tab === 'servicios') cargarServicios(); }, [tab, cargarServicios]);

  // ─ Acciones: citas ─
  const actualizarEstado = async (cita_id: string, estado: string) => {
    setActualizando(cita_id);
    try {
      const res = await fetch('/api/barbero/citas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cita_id, estado })
      });
      const data = await res.json();
      if (data.success) setCitas(prev => prev.map(c => c.id === cita_id ? { ...c, estado: estado as Cita['estado'] } : c));
      else setError(data.error || 'Error al actualizar.');
    } catch { setError('Error de conexión.'); }
    finally { setActualizando(null); }
  };

  // ─ Acciones: guardar jornada ─
  const guardarJornada = async () => {
    if (!barbero?.id) return;
    setGuardandoJornada(true);
    try {
      const res = await fetch('/api/barbero/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'jornada', barbero_id: barbero.id, dias: jornada })
      });
      const data = await res.json();
      if (!data.success) setError(data.error || 'Error al guardar jornada.');
    } catch { setError('Error de conexión.'); }
    finally { setGuardandoJornada(false); }
  };

  // ─ Acciones: bloquear slot ─
  const bloquearSlot = async (fecha: string, hora_inicio?: string, hora_fin?: string) => {
    if (!barbero?.id) return;
    const key = hora_inicio ? `${fecha}-${hora_inicio}` : fecha;
    setBloqueandoSlot(key);
    try {
      const res = await fetch('/api/barbero/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'bloqueo', barbero_id: barbero.id, fecha, hora_inicio, hora_fin })
      });
      const data = await res.json();
      if (data.success) setBloqueos(prev => [...prev, data.bloqueo]);
      else setError(data.error || 'Error al bloquear.');
    } catch { setError('Error de conexión.'); }
    finally { setBloqueandoSlot(null); }
  };

  // ─ Acciones: desbloquear ─
  const desbloquear = async (id: string) => {
    setBloqueandoSlot(id);
    try {
      const res = await fetch(`/api/barbero/horarios?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setBloqueos(prev => prev.filter(b => b.id !== id));
      else setError(data.error || 'Error al desbloquear.');
    } catch { setError('Error de conexión.'); }
    finally { setBloqueandoSlot(null); }
  };

  // ─ Acciones: guardar perfil ─
  const guardarPerfil = async () => {
    if (!barbero?.id || !user?.id) return;
    setGuardandoPerfil(true);
    try {
      const res = await fetch('/api/barbero/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          barbero_id: barbero.id, 
          usuario_id: user.id,
          nombre: nuevoPerfil.nombre,
          direccion: nuevoPerfil.direccion,
          descripcion: nuevoPerfil.descripcion 
        })
      });
      const data = await res.json();
      if (data.success) {
        setBarbero({ ...barbero, descripcion: nuevoPerfil.descripcion, direccion: nuevoPerfil.direccion });
        if (data.nombre_actualizado) {
          const stored = localStorage.getItem('sb_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.nombre = data.nombre_actualizado;
            localStorage.setItem('sb_user', JSON.stringify(parsed));
            window.location.reload();
            return; // Detener ejecución para que la recarga fluya
          }
        }
        setEditandoPerfil(false);
      } else setError(data.error || 'Error al guardar perfil.');
    } catch { setError('Error de conexión.'); }
    finally { setGuardandoPerfil(false); }
  };

  // ─ Guards ─
  if (isLoading || !isAuthenticated || user?.tipo !== 'barbero') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>Verificando credenciales...</p>
      </div>
    );
  }

  // ─ Estadísticas ─
  const total      = citas.length;
  const pendientes = citas.filter(c => c.estado === 'pendiente').length;
  const completadas = citas.filter(c => c.estado === 'completada').length;
  const ingresos   = citas.filter(c => c.estado === 'completada').reduce((s, c) => s + (c.servicio?.precio || 0), 0);

  // ─ Helpers de horarios ─
  const anio = mesActual.getFullYear();
  const mes  = mesActual.getMonth();
  const diasMes = diasDelMes(anio, mes);
  const primerDia = new Date(anio, mes, 1).getDay(); // 0=Dom

  const bloqueosPorFecha = bloqueos.reduce<Record<string, Bloqueo[]>>((acc, b) => {
    (acc[b.fecha] ??= []).push(b); return acc;
  }, {});

  const jornadaDia = diaSeleccionado
    ? jornada.find(j => j.activo && j.dia_semana === new Date(diaSeleccionado + 'T12:00:00').getDay())
    : null;

  const slotsDelDia = jornadaDia
    ? generarSlots(jornadaDia.hora_inicio, jornadaDia.hora_fin)
    : [];

  const bloqueosDia = diaSeleccionado ? (bloqueosPorFecha[diaSeleccionado] ?? []) : [];
  const diaBloqueadoCompleto = bloqueosDia.some(b => b.hora_inicio === null);

  function slotBloqueado(slot: string): Bloqueo | undefined {
    return bloqueosDia.find(b => b.hora_inicio?.slice(0, 5) === slot);
  }

  // ─ Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '30px 20px' }}>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Scissors color="var(--color-primary)" size={22} />
              <h1 style={{ color: 'var(--color-primary)', fontSize: '1.8rem', letterSpacing: '-0.5px' }}>Panel del Barbero</h1>
            </div>
            
            {editandoPerfil && barbero ? (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Nombre</label>
                  <input type="text" value={nuevoPerfil.nombre} onChange={e => setNuevoPerfil({...nuevoPerfil, nombre: e.target.value})} style={{ backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-text)', fontSize: '0.85rem', width: '300px', maxWidth: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Dirección</label>
                  <input type="text" value={nuevoPerfil.direccion} onChange={e => setNuevoPerfil({...nuevoPerfil, direccion: e.target.value})} style={{ backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-text)', fontSize: '0.85rem', width: '300px', maxWidth: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'block' }}>Descripción / Bio</label>
                  <input type="text" value={nuevoPerfil.descripcion} onChange={e => setNuevoPerfil({...nuevoPerfil, descripcion: e.target.value})} style={{ backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-text)', fontSize: '0.85rem', width: '300px', maxWidth: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                  <button onClick={guardarPerfil} disabled={guardandoPerfil} style={{ backgroundColor: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>{guardandoPerfil ? 'Guardando...' : 'Guardar'}</button>
                  <button onClick={() => setEditandoPerfil(false)} style={{ backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {user.nombre}
                  {barbero && (<span style={{ marginLeft: '10px' }}><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />{barbero.direccion}</span>)}
                </p>
                {barbero && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px', marginBottom: '8px' }}>
                    <Star size={14} color="#f1c40f" fill="#f1c40f" />
                    <span style={{ color: '#f1c40f', fontSize: '0.85rem', fontWeight: 600 }}>{Number(barbero.rating_promedio).toFixed(1)}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>calificación promedio</span>
                  </div>
                )}
                {barbero && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <span style={{ fontStyle: 'italic' }}>{barbero.descripcion || 'Sin descripción'}</span>
                      <button onClick={() => { setNuevoPerfil({ nombre: user.nombre || '', direccion: barbero.direccion || '', descripcion: barbero.descripcion || '' }); setEditandoPerfil(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>Editar Perfil</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={() => { logout(); window.location.href = '/barbero/login'; }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1c1c1e', color: 'var(--color-text)', border: '1px solid var(--color-border)', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '28px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border)', width: 'fit-content' }}>
          {([['citas', <Calendar key="c" size={15} />, 'Citas del día'], ['horarios', <Settings key="h" size={15} />, 'Gestión de Horarios'], ['servicios', <Scissors key="s" size={15} />, 'Servicios']] as const).map(([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '10px 20px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.88rem',
                backgroundColor: tab === key ? 'var(--color-primary)' : 'var(--color-surface)',
                color: tab === key ? '#000' : 'var(--color-text-muted)',
                transition: 'all 0.2s'
              }}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid #e74c3c', borderRadius: '6px', padding: '12px', color: '#e74c3c', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* ═══ TAB: CITAS ═══════════════════════════════════════════════════════ */}
        {tab === 'citas' && (
          <>
            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
              {[
                { label: 'Total citas',     value: total,    color: 'var(--color-primary)' },
                { label: 'Pendientes',      value: pendientes, color: '#f1c40f' },
                { label: 'Completadas',     value: completadas, color: '#2ecc71' },
                { label: 'Ingresos del día', value: `$${ingresos.toFixed(0)}`, color: '#3498db' },
              ].map(stat => (
                <div key={stat.label} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Selector fecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} color="var(--color-primary)" />
                <input type="date" value={fechaSeleccionada} onChange={e => setFechaSeleccionada(e.target.value)}
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px', color: 'var(--color-text)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }} />
              </div>
              <button onClick={() => setFechaSeleccionada('')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: fechaSeleccionada === '' ? 'var(--color-primary)' : 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 14px', color: fechaSeleccionada === '' ? '#000' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: fechaSeleccionada === '' ? 'bold' : 'normal' }}>
                Todas
              </button>
              <button onClick={cargarCitas} disabled={cargando}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 14px', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                <RefreshCw size={14} style={{ animation: cargando ? 'spin 1s linear infinite' : 'none' }} />Actualizar
              </button>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                {fechaSeleccionada === '' ? 'Mostrando todo el historial' : formatFecha(fechaSeleccionada + 'T12:00:00')}
              </span>
            </div>

            {/* Lista citas */}
            {cargando ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>Cargando citas...</div>
            ) : citas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
                <Calendar size={40} color="var(--color-border)" style={{ marginBottom: '12px' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>No hay citas {fechaSeleccionada === '' ? 'en el historial' : 'para este día'}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {citas.map(cita => {
                  const cfg = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.pendiente;
                  const enProceso = actualizando === cita.id;
                  return (
                    <div key={cita.id} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', opacity: cita.estado === 'cancelada' ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <User size={16} color="var(--color-primary)" />
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{cita.cliente?.nombre || 'Cliente desconocido'}</span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{cita.cliente?.telefono}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                            <Clock size={14} color="var(--color-primary)" />{formatHora(cita.fecha_hora)}
                          </span>
                          {cita.servicio && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                              <Scissors size={14} />{cita.servicio.nombre} · {cita.servicio.duracion_min} min · <strong style={{ color: 'white' }}>${cita.servicio.precio}</strong>
                            </span>
                          )}
                        </div>
                        {cita.notas && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '6px', fontStyle: 'italic' }}>"{cita.notas}"</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ padding: '5px 12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 600, backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {!['completada', 'cancelada'].includes(cita.estado) && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {cita.estado === 'pendiente' && (
                              <button onClick={() => actualizarEstado(cita.id, 'confirmada')} disabled={enProceso} title="Confirmar cita"
                                style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer' }}>
                                <CheckCircle size={26} />
                              </button>
                            )}
                            {cita.estado === 'confirmada' && (
                              <button onClick={() => actualizarEstado(cita.id, 'en_curso')} disabled={enProceso} title="Iniciar servicio"
                                style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>
                                <PlayCircle size={26} />
                              </button>
                            )}
                            {cita.estado === 'en_curso' && (
                              <button onClick={() => actualizarEstado(cita.id, 'completada')} disabled={enProceso} title="Completar"
                                style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer' }}>
                                <CheckCircle size={26} />
                              </button>
                            )}
                            <button onClick={() => actualizarEstado(cita.id, 'cancelada')} disabled={enProceso} title="Cancelar"
                              style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>
                              <XCircle size={26} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══ TAB: HORARIOS ════════════════════════════════════════════════════ */}
        {tab === 'horarios' && (
          <div style={{ display: 'grid', gridTemplateColumns: diaSeleccionado ? '1fr 320px' : '1fr', gap: '24px' }}>

            {/* Columna izquierda */}
            <div>
              {/* ── Jornada base ── */}
              <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>Jornada base</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {jornada.map((dia, idx) => (
                    <div key={dia.dia_semana} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {/* Toggle día activo */}
                      <button
                        onClick={() => {
                          const next = [...jornada];
                          next[idx] = { ...next[idx], activo: !next[idx].activo };
                          setJornada(next);
                        }}
                        style={{
                          width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative',
                          backgroundColor: dia.activo ? 'var(--color-primary)' : '#444',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <span style={{ position: 'absolute', top: '3px', left: dia.activo ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                      </button>

                      <span style={{ width: '38px', fontSize: '0.88rem', color: dia.activo ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                        {DIAS_FULL[dia.dia_semana].slice(0, 3)}
                      </span>

                      {dia.activo && (
                        <>
                          <input type="time" value={dia.hora_inicio}
                            onChange={e => { const n = [...jornada]; n[idx] = { ...n[idx], hora_inicio: e.target.value }; setJornada(n); }}
                            style={{ backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 8px', color: 'var(--color-text)', fontSize: '0.85rem' }} />
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                          <input type="time" value={dia.hora_fin}
                            onChange={e => { const n = [...jornada]; n[idx] = { ...n[idx], hora_fin: e.target.value }; setJornada(n); }}
                            style={{ backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 8px', color: 'var(--color-text)', fontSize: '0.85rem' }} />
                        </>
                      )}
                      {!dia.activo && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Día libre</span>}
                    </div>
                  ))}
                </div>
                <button onClick={guardarJornada} disabled={guardandoJornada}
                  style={{ marginTop: '16px', backgroundColor: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
                  {guardandoJornada ? 'Guardando...' : 'Guardar jornada'}
                </button>
              </div>

              {/* ── Calendario mensual ── */}
              <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px' }}>
                {/* Navegación mes */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button onClick={() => setMesActual(new Date(anio, mes - 1, 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '4px' }}>
                    <ChevronLeft size={20} />
                  </button>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.95rem' }}>{mesLabel(anio, mes)}</span>
                  <button onClick={() => setMesActual(new Date(anio, mes + 1, 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)', padding: '4px' }}>
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Cabecera días */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '8px' }}>
                  {DIAS_SEMANA.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
                  ))}
                </div>

                {/* Días del mes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
                  {/* Espacios vacíos hasta el primer día */}
                  {Array.from({ length: primerDia }).map((_, i) => <div key={`empty-${i}`} />)}

                  {diasMes.map(dia => {
                    const dateStr = toDateStr(dia);
                    const isPast = dateStr < new Date().toISOString().split('T')[0];
                    const bList = bloqueosPorFecha[dateStr] ?? [];
                    const totBlq = bList.length;
                    const diaCompleto = bList.some(b => b.hora_inicio === null);
                    const jornadaActiva = jornada.find(j => j.dia_semana === dia.getDay())?.activo ?? false;
                    const esHoy = dateStr === new Date().toISOString().split('T')[0];
                    const seleccionado = dateStr === diaSeleccionado;

                    return (
                      <button
                        key={dateStr}
                        disabled={isPast}
                        onClick={() => setDiaSeleccionado(seleccionado ? null : dateStr)}
                        style={{
                          aspectRatio: '1', borderRadius: '8px', border: seleccionado ? '2px solid var(--color-primary)' : '1px solid transparent',
                          backgroundColor: diaCompleto ? 'rgba(231,76,60,0.3)' : totBlq > 0 ? 'rgba(241,196,15,0.15)' : seleccionado ? 'rgba(255,215,0,0.1)' : '#1c1c1e',
                          color: (!jornadaActiva || isPast) ? 'var(--color-text-muted)' : 'var(--color-text)',
                          cursor: isPast ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: esHoy ? 700 : 400,
                          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: (!jornadaActiva || isPast) ? 0.35 : 1
                        }}
                      >
                        {dia.getDate()}
                        {totBlq > 0 && !diaCompleto && (
                          <span style={{ position: 'absolute', bottom: '3px', right: '3px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f1c40f' }} />
                        )}
                        {diaCompleto && (
                          <span style={{ position: 'absolute', bottom: '3px', right: '3px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e74c3c' }} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Leyenda */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap' }}>
                  {[
                    { color: 'rgba(231,76,60,0.3)', dot: '#e74c3c', label: 'Día bloqueado' },
                    { color: 'rgba(241,196,15,0.15)', dot: '#f1c40f', label: 'Slots bloqueados' },
                    { color: '#1c1c1e', dot: 'transparent', label: 'Disponible' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: l.dot, border: l.dot === 'transparent' ? '1px solid #444' : 'none' }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna derecha: panel del día */}
            {diaSeleccionado && (
              <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px', position: 'sticky', top: '20px', alignSelf: 'start' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '14px', textTransform: 'capitalize' }}>
                  {new Date(diaSeleccionado + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>

                {/* Bloquear día completo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 12px', backgroundColor: '#1c1c1e', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                    <Lock size={14} color="#e74c3c" /> Bloquear día completo
                  </div>
                  <button
                    onClick={() => {
                      if (diaBloqueadoCompleto) {
                        const bloqueo = bloqueosDia.find(b => b.hora_inicio === null);
                        if (bloqueo) desbloquear(bloqueo.id);
                      } else {
                        bloquearSlot(diaSeleccionado);
                      }
                    }}
                    disabled={bloqueandoSlot === diaSeleccionado}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative',
                      backgroundColor: diaBloqueadoCompleto ? '#e74c3c' : '#444',
                    }}
                  >
                    <span style={{ position: 'absolute', top: '3px', left: diaBloqueadoCompleto ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                  </button>
                </div>

                {/* Slots horarios */}
                {!jornadaDia ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Día libre según la jornada base.</p>
                ) : diaBloqueadoCompleto ? (
                  <p style={{ color: '#e74c3c', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Este día está bloqueado completamente.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
                    {slotsDelDia.map(slot => {
                      const bloqueo = slotBloqueado(slot);
                      const isBlocked = !!bloqueo;
                      const slotFin = (() => {
                        const [h, m] = slot.split(':').map(Number);
                        const total = h * 60 + m + 30;
                        return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
                      })();
                      const loading = bloqueandoSlot === (bloqueo?.id ?? `${diaSeleccionado}-${slot}`);

                      return (
                        <div key={slot} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '8px 10px', borderRadius: '7px',
                          backgroundColor: isBlocked ? 'rgba(231,76,60,0.12)' : '#1c1c1e',
                          border: `1px solid ${isBlocked ? 'rgba(231,76,60,0.3)' : 'var(--color-border)'}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                            {isBlocked
                              ? <Lock size={13} color="#e74c3c" />
                              : <Unlock size={13} color="#2ecc71" />}
                            <span style={{ color: isBlocked ? '#e74c3c' : 'var(--color-text)' }}>
                              {slot.replace(':', ':')} – {slotFin.replace(':', ':')}
                            </span>
                          </div>
                          <button
                            disabled={loading}
                            onClick={() => {
                              if (isBlocked) desbloquear(bloqueo.id);
                              else bloquearSlot(diaSeleccionado, slot, slotFin);
                            }}
                            style={{
                              fontSize: '0.75rem', padding: '3px 10px', borderRadius: '6px',
                              border: 'none', cursor: 'pointer', fontWeight: 600,
                              backgroundColor: isBlocked ? '#e74c3c' : 'rgba(46,204,113,0.15)',
                              color: isBlocked ? '#fff' : '#2ecc71',
                            }}
                          >
                            {loading ? '...' : isBlocked ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* ═══ TAB: SERVICIOS ════════════════════════════════════════════════════ */}
        {tab === 'servicios' && (
          <div>
            <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>{editandoServicio ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}</h2>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>Nombre del Servicio</label>
                  <input type="text" value={editandoServicio ? editandoServicio.nombre : nuevoServicio.nombre} onChange={e => editandoServicio ? setEditandoServicio({...editandoServicio, nombre: e.target.value}) : setNuevoServicio({...nuevoServicio, nombre: e.target.value})} style={{ width: '100%', backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', color: 'var(--color-text)' }} placeholder="Ej. Corte Clásico" />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>Duración (min)</label>
                  <input type="number" step="15" min="15" value={editandoServicio ? editandoServicio.duracion_min : nuevoServicio.duracion_min} onChange={e => editandoServicio ? setEditandoServicio({...editandoServicio, duracion_min: Number(e.target.value)}) : setNuevoServicio({...nuevoServicio, duracion_min: Number(e.target.value)})} style={{ width: '100%', backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', color: 'var(--color-text)' }} />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '6px', display: 'block' }}>Precio ($)</label>
                  <input type="number" min="10" value={editandoServicio ? editandoServicio.precio : nuevoServicio.precio} onChange={e => editandoServicio ? setEditandoServicio({...editandoServicio, precio: Number(e.target.value)}) : setNuevoServicio({...nuevoServicio, precio: Number(e.target.value)})} style={{ width: '100%', backgroundColor: '#1c1c1e', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px', color: 'var(--color-text)' }} />
                </div>
                <button onClick={async () => {
                  if (!barbero?.id) return;
                  const payload = editandoServicio || { ...nuevoServicio, barbero_id: barbero.id };
                  const method = editandoServicio ? 'PATCH' : 'POST';
                  try {
                    const res = await fetch('/api/barbero/servicios', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    const data = await res.json();
                    if (data.success) {
                      cargarServicios();
                      if (editandoServicio) setEditandoServicio(null);
                      else setNuevoServicio({ nombre: '', duracion_min: 30, precio: 100 });
                    } else setError(data.error);
                  } catch { setError('Error al guardar.'); }
                }} style={{ backgroundColor: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', height: '41px' }}>
                  {editandoServicio ? 'Actualizar' : 'Añadir'}
                </button>
                {editandoServicio && (
                  <button onClick={() => setEditandoServicio(null)} style={{ backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', height: '41px' }}>Cancelar</button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {cargandoServicios ? <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px' }}>Cargando servicios...</p> : servicios.map(s => (
                <div key={s.id} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px', color: 'var(--color-text)' }}>{s.nombre}</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{s.duracion_min} min · <span style={{ color: '#2ecc71', fontWeight: 600 }}>${s.precio}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditandoServicio(s)} style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 12px', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.85rem' }}>Editar</button>
                    <button onClick={async () => {
                      if(confirm('¿Eliminar servicio?')) {
                        try {
                          const res = await fetch(`/api/barbero/servicios?id=${s.id}`, { method: 'DELETE' });
                          if (res.ok) cargarServicios();
                          else setError('Error al eliminar');
                        } catch { setError('Error al eliminar'); }
                      }
                    }} style={{ backgroundColor: 'transparent', border: '1px solid #e74c3c', borderRadius: '6px', padding: '6px 12px', color: '#e74c3c', cursor: 'pointer', fontSize: '0.85rem' }}>Eliminar</button>
                  </div>
                </div>
              ))}
              {!cargandoServicios && servicios.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '40px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px' }}>No tienes servicios registrados.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
      `}</style>
    </div>
  );
}