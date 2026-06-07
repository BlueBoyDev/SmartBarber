"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar, CheckCircle, Clock, XCircle, LogOut,
  RefreshCw, MapPin, Star, Scissors, PlayCircle, User
} from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
}

interface Servicio {
  id: string;
  nombre: string;
  duracion_min: number;
  precio: number;
}

interface Cita {
  id: string;
  fecha_hora: string;
  estado: 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada';
  notas: string | null;
  cliente: Cliente | null;
  servicio: Servicio | null;
}

interface BarberoProfile {
  id: string;
  descripcion: string;
  rating_promedio: number;
  direccion: string;
  activo: boolean;
}

const ESTADO_CONFIG = {
  pendiente:  { label: 'Pendiente',   color: '#f1c40f', bg: 'rgba(241,196,15,0.15)' },
  confirmada: { label: 'Confirmada',  color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
  en_curso:   { label: 'En curso',    color: '#3498db', bg: 'rgba(52,152,219,0.15)' },
  completada: { label: 'Completada',  color: '#95a5a6', bg: 'rgba(149,165,166,0.15)' },
  cancelada:  { label: 'Cancelada',   color: '#e74c3c', bg: 'rgba(231,76,60,0.15)' },
};

function formatHora(fechaISO: string) {
  return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatFecha(fechaISO: string) {
  return new Date(fechaISO).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [citas, setCitas] = useState<Cita[]>([]);
  const [barbero, setBarbero] = useState<BarberoProfile | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Proteger ruta
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.tipo !== 'barbero') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Cargar perfil del barbero
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/barbero/perfil?usuario_id=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setBarbero(data.barbero);
      })
      .catch(() => setError('Error al cargar perfil del barbero.'));
  }, [user?.id]);

  // Cargar citas del día
  const cargarCitas = useCallback(async () => {
    if (!barbero?.id) return;
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`/api/barbero/citas?barbero_id=${barbero.id}&fecha=${fechaSeleccionada}`);
      const data = await res.json();
      if (data.success) {
        setCitas(data.citas);
      } else {
        setError(data.error || 'Error al cargar citas.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setCargando(false);
    }
  }, [barbero?.id, fechaSeleccionada]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const actualizarEstado = async (cita_id: string, estado: string) => {
    setActualizando(cita_id);
    try {
      const res = await fetch('/api/barbero/citas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cita_id, estado })
      });
      const data = await res.json();
      if (data.success) {
        setCitas(prev => prev.map(c => c.id === cita_id ? { ...c, estado: estado as Cita['estado'] } : c));
      } else {
        setError(data.error || 'Error al actualizar.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setActualizando(null);
    }
  };

  if (isLoading || !isAuthenticated || user?.tipo !== 'barbero') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>Verificando credenciales...</p>
      </div>
    );
  }

  // Estadísticas del día
  const total = citas.length;
  const confirmadas = citas.filter(c => c.estado === 'confirmada').length;
  const completadas = citas.filter(c => c.estado === 'completada').length;
  const pendientes = citas.filter(c => c.estado === 'pendiente').length;
  const ingresos = citas
    .filter(c => c.estado === 'completada')
    .reduce((sum, c) => sum + (c.servicio?.precio || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '30px 20px' }}>
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '30px', flexWrap: 'wrap', gap: '15px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <Scissors color="var(--color-primary)" size={22} />
              <h1 style={{ color: 'var(--color-primary)', fontSize: '1.8rem', letterSpacing: '-0.5px' }}>
                Panel del Barbero
              </h1>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {user.nombre}
              {barbero && (
                <span style={{ marginLeft: '10px' }}>
                  <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {barbero.direccion}
                </span>
              )}
            </p>
            {barbero && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                <Star size={14} color="#f1c40f" fill="#f1c40f" />
                <span style={{ color: '#f1c40f', fontSize: '0.85rem', fontWeight: 600 }}>
                  {Number(barbero.rating_promedio).toFixed(1)}
                </span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>calificación promedio</span>
              </div>
            )}
          </div>

          <button
            onClick={() => { logout(); window.location.href = '/barbero/login'; }}
            //onClick={() => { logout(); router.push('/barbero/login'); }}
            //onClick={() => { logout(); router.push('/'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: '#1c1c1e', color: 'var(--color-text)',
              border: '1px solid var(--color-border)', padding: '10px 18px',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 600
            }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>

        {/* Estadísticas del día */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '15px', marginBottom: '30px'
        }}>
          {[
            { label: 'Total citas', value: total, color: 'var(--color-primary)' },
            { label: 'Pendientes', value: pendientes, color: '#f1c40f' },
            { label: 'Completadas', value: completadas, color: '#2ecc71' },
            { label: 'Ingresos del día', value: `$${ingresos.toFixed(0)}`, color: '#3498db' },
          ].map(stat => (
            <div key={stat.label} style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px', padding: '18px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Selector de fecha + botón refrescar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '20px', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={e => setFechaSeleccionada(e.target.value)}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px', padding: '8px 12px',
                color: 'var(--color-text)', fontSize: '0.9rem',
                outline: 'none', cursor: 'pointer'
              }}
            />
          </div>
          <button
            onClick={cargarCitas}
            disabled={cargando}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px', padding: '8px 14px',
              color: 'var(--color-text-muted)', cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={14} style={{ animation: cargando ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {formatFecha(fechaSeleccionada + 'T12:00:00')}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid #e74c3c',
            borderRadius: '6px', padding: '12px', color: '#e74c3c',
            marginBottom: '20px', fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        {/* Lista de citas */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)' }}>
            Cargando citas...
          </div>
        ) : citas.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px'
          }}>
            <Calendar size={40} color="var(--color-border)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No hay citas para este día.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {citas.map(cita => {
              const cfg = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.pendiente;
              const enProceso = actualizando === cita.id;
              return (
                <div key={cita.id} style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px', padding: '20px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '16px',
                  opacity: cita.estado === 'cancelada' ? 0.5 : 1,
                  transition: 'opacity 0.2s'
                }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <User size={16} color="var(--color-primary)" />
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                        {cita.cliente?.nombre || 'Cliente desconocido'}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        {cita.cliente?.telefono}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                        <Clock size={14} color="var(--color-primary)" />
                        {formatHora(cita.fecha_hora)}
                      </span>
                      {cita.servicio && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                          <Scissors size={14} />
                          {cita.servicio.nombre} · {cita.servicio.duracion_min} min · 
                          <strong style={{ color: 'white' }}>${cita.servicio.precio}</strong>
                        </span>
                      )}
                    </div>
                    {cita.notas && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginTop: '6px', fontStyle: 'italic' }}>
                        "{cita.notas}"
                      </p>
                    )}
                  </div>

                  {/* Estado + acciones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '5px 12px', borderRadius: '12px',
                      fontSize: '0.82rem', fontWeight: 600,
                      backgroundColor: cfg.bg, color: cfg.color
                    }}>
                      {cfg.label}
                    </span>

                    {!['completada', 'cancelada'].includes(cita.estado) && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {cita.estado === 'pendiente' && (
                          <button
                            onClick={() => actualizarEstado(cita.id, 'confirmada')}
                            disabled={enProceso}
                            title="Confirmar cita"
                            style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer' }}
                          >
                            <CheckCircle size={26} />
                          </button>
                        )}
                        {cita.estado === 'confirmada' && (
                          <button
                            onClick={() => actualizarEstado(cita.id, 'en_curso')}
                            disabled={enProceso}
                            title="Iniciar servicio"
                            style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}
                          >
                            <PlayCircle size={26} />
                          </button>
                        )}
                        {cita.estado === 'en_curso' && (
                          <button
                            onClick={() => actualizarEstado(cita.id, 'completada')}
                            disabled={enProceso}
                            title="Marcar como completada"
                            style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer' }}
                          >
                            <CheckCircle size={26} />
                          </button>
                        )}
                        <button
                          onClick={() => actualizarEstado(cita.id, 'cancelada')}
                          disabled={enProceso}
                          title="Cancelar cita"
                          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}
                        >
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
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}