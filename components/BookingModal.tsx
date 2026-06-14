"use client";

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  serviceId: string | null;
  barberoId: string;
  barberoNombre: string;
}

export function BookingModal({ isOpen, onClose, serviceTitle, serviceId, barberoId, barberoNombre }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTimeObj, setSelectedTimeObj] = useState<{ raw: string, display: string } | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [timeSlots, setTimeSlots] = useState<{ raw: string, display: string }[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (!selectedDate || !barberoId) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setSelectedTimeObj(null); // Reset hora al cambiar de día
      try {
        // format date to YYYY-MM-DD local
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const res = await fetch(`/api/disponibilidad?barbero_id=${barberoId}&fecha=${dateStr}`);
        const data = await res.json();
        
        if (data.horarios) {
          setTimeSlots(data.horarios);
        } else {
          setTimeSlots([]);
        }
      } catch (error) {
        console.error("Error fetching slots", error);
        setTimeSlots([]);
      }
      setIsLoadingSlots(false);
    };

    fetchSlots();
  }, [selectedDate, barberoId]);

  if (!isOpen) return null;

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeObj || !serviceId) return;

    setIsLoading(true);
    try {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceTitle,
          serviceId: serviceId,
          barberoId: barberoId,
          date: dateStr,
          rawTime: selectedTimeObj.raw,
          name: name,
          phone: phone
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
      } else {
        alert(data.error || "Ocurrió un error");
      }
    } catch (error) {
      alert("Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius)',
        padding: '30px', width: '100%', maxWidth: '400px', maxHeight: '90vh',
        overflowY: 'auto', border: '1px solid var(--color-border)', position: 'relative',
        animation: 'fadeIn 0.3s ease'
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '15px' }}>¡SMS Enviado!</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              En un entorno real, acabamos de enviar un mensaje de texto al {phone}. El código de prueba es 1234.
            </p>
            <p style={{ color: '#2ecc71', fontSize: '0.9rem', marginBottom: '20px' }}>
              Tu cita con {barberoNombre} ha sido agendada.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Finalizar Prueba
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={onClose} disabled={isLoading}
              style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: 'var(--color-text)', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ color: 'var(--color-primary)', marginBottom: '5px' }}>Reservar {serviceTitle}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Con {barberoNombre}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <DayPicker 
                mode="single" 
                selected={selectedDate} 
                onSelect={setSelectedDate}
                locale={es}
                disabled={[{ before: new Date() }]} 
                modifiersStyles={{
                  selected: { backgroundColor: 'var(--color-primary)', color: 'black', fontWeight: 'bold' }
                }}
              />
            </div>

            {selectedDate && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Horarios para el {format(selectedDate, "d 'de' MMMM", { locale: es })}</h3>
                
                {isLoadingSlots ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                    <Loader2 size={16} className="animate-spin" /> Cargando disponibilidad...
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(231,76,60,0.1)', borderRadius: '6px', color: '#e74c3c', fontSize: '0.9rem' }}>
                    No hay horarios disponibles para este día.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {timeSlots.map(time => (
                      <button 
                        key={time.raw}
                        onClick={() => setSelectedTimeObj(time)}
                        disabled={isLoading}
                        style={{
                          padding: '8px 16px', borderRadius: '4px',
                          background: selectedTimeObj?.raw === time.raw ? 'var(--color-primary)' : 'transparent',
                          color: selectedTimeObj?.raw === time.raw ? '#000' : 'var(--color-text)',
                          border: `1px solid ${selectedTimeObj?.raw === time.raw ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 600,
                          opacity: isLoading ? 0.5 : 1
                        }}
                      >
                        {time.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(selectedDate && selectedTimeObj) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Tus Datos</h3>
                <input 
                  type="text" placeholder="Ingresa tu Nombre Completo"
                  value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading}
                  style={{ padding: '14px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#111', color: 'white', width: '100%', outline: 'none' }}
                />
                <input 
                  type="tel" placeholder="Número de Teléfono (10 dígitos)"
                  value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading}
                  style={{ padding: '14px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#111', color: 'white', width: '100%', outline: 'none' }}
                />
                <button 
                  className="btn-primary" 
                  style={{ 
                    width: '100%', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                    opacity: (!name || phone.length < 10 || isLoading) ? 0.5 : 1
                  }}
                  disabled={!name || phone.length < 10 || isLoading}
                  onClick={handleBooking}
                >
                  {isLoading && <Loader2 size={20} className="animate-spin" />}
                  {isLoading ? 'Procesando...' : 'Confirmar Reserva'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
