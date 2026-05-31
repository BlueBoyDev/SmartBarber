"use client";

import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';

// Estructura de prueba para simular los datos viniendo de Supabase
const mockAppointments = [
  { id: '1', date: '2026-04-19', time: '10:00 AM', customer: 'Carlos P.', service: 'Corte Clásico', status: 'unverified' },
  { id: '2', date: '2026-04-19', time: '11:00 AM', customer: 'Jorge Garcia', service: 'Arreglo de Barba', status: 'confirmed' },
  { id: '3', date: '2026-04-19', time: '12:30 PM', customer: 'Armando Robles', service: 'Paquete Premium', status: 'completed' },
];

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState(mockAppointments);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setAppointments(appointments.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ color: 'var(--color-primary)' }}>Panel de Administración</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Gestión diaria de reservaciones</p>
          </div>
          <span style={{ backgroundColor: '#111', padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
            <Calendar size={18} style={{ display: 'inline', marginRight: '10px', verticalAlign: 'middle', color: 'var(--color-primary)' }}/> 
            Resumen de Hoy
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {appointments.map(app => (
            <div key={app.id} style={{ 
              backgroundColor: 'var(--color-surface)', 
              padding: '24px', 
              borderRadius: '8px', 
              border: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              transition: 'var(--transition)',
              opacity: app.status === 'cancelled' ? 0.5 : 1
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '5px' }}>{app.customer} <span style={{color: 'var(--color-text-muted)', fontWeight: 'normal'}}> - {app.service}</span></h3>
                <p style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={16} color="var(--color-primary)" /> Hoy a las {app.time}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ 
                  padding: '6px 12px', 
                  borderRadius: '12px', 
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: app.status === 'confirmed' ? 'rgba(46, 204, 113, 0.2)' : app.status === 'unverified' ? 'rgba(241, 196, 15, 0.2)' : app.status === 'cancelled' ? 'rgba(231, 76, 60, 0.2)' : 'transparent',
                  color: app.status === 'confirmed' ? '#2ecc71' : app.status === 'unverified' ? '#f1c40f' : app.status === 'cancelled' ? '#e74c3c' : 'var(--color-text-muted)'
                }}>
                  {app.status === 'confirmed' ? 'Confirmado' : app.status === 'unverified' ? 'Pendiente SMS' : app.status === 'cancelled' ? 'Cancelado' : 'Completado'}
                </span>

                {(app.status !== 'completed' && app.status !== 'cancelled') && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleUpdateStatus(app.id, 'completed')}
                      style={{ background: 'none', border: 'none', color: '#2ecc71', cursor: 'pointer', transition: 'transform 0.2s' }}
                      title="Marcar como Completado"
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <CheckCircle size={28} />
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                      style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', transition: 'transform 0.2s' }}
                      title="Cancelar Cita"
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <XCircle size={28} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {appointments.length === 0 && (
             <p style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>No hay citas registradas hoy.</p>
          )}
        </div>
      </div>
    </div>
  );
}
