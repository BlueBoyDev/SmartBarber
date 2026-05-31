"use client";

import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
}

export function BookingModal({ isOpen, onClose, serviceTitle }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Estado para prevenir múltiples clics y dar retroalimentación visual
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const timeSlots = ["10:00 AM", "11:00 AM", "12:30 PM", "02:00 PM", "04:00 PM", "05:30 PM"];

  // Buena práctica: Función asíncrona dedicada a la comunicación con la API
  const handleBooking = async () => {
    setIsLoading(true); // Bloquemos el botón al inicio
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceTitle,
          date: selectedDate,
          time: selectedTime,
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
      setIsLoading(false); // Siempre lo desbloqueamos, ya sea que haya éxito o falle
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--border-radius)',
        padding: '30px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid var(--color-border)',
        position: 'relative',
        animation: 'fadeIn 0.3s ease'
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 10px' }}>
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '15px' }}>¡SMS Enviado!</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              En un entorno real, acabamos de enviar un mensaje de texto al {phone}. El código de prueba es 1234.
            </p>
            <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Finalizar Prueba
            </button>
          </div>
        ) : (
          <>
            <button 
              onClick={onClose}
              disabled={isLoading}
              style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: 'var(--color-text)', cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              <X size={24} />
            </button>

            <h2 style={{ color: 'var(--color-primary)', marginBottom: '5px' }}>Reservar {serviceTitle}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Selecciona tu fecha y hora preferida
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {timeSlots.map(time => (
                    <button 
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      disabled={isLoading}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        background: selectedTime === time ? 'var(--color-primary)' : 'transparent',
                        color: selectedTime === time ? '#000' : 'var(--color-text)',
                        border: `1px solid ${selectedTime === time ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        opacity: isLoading ? 0.5 : 1
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(selectedDate && selectedTime) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Tus Datos</h3>
                <input 
                  type="text" 
                  placeholder="Ingresa tu Nombre Completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  style={{ padding: '14px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#111', color: 'white', width: '100%', outline: 'none' }}
                />
                <input 
                  type="tel" 
                  placeholder="Número de Teléfono (10 dígitos)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  style={{ padding: '14px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#111', color: 'white', width: '100%', outline: 'none' }}
                />
                <button 
                  className="btn-primary" 
                  style={{ 
                    width: '100%', 
                    marginTop: '10px', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '10px',
                    opacity: (!name || phone.length < 10 || isLoading) ? 0.5 : 1
                  }}
                  disabled={!name || phone.length < 10 || isLoading}
                  onClick={handleBooking}
                >
                  {isLoading && <Loader2 size={20} className="animate-spin" />}
                  {isLoading ? 'Procesando...' : 'Continuar a Verificación SMS'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
