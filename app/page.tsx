"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ServiceCard } from '@/components/ServiceCard';
import { BookingModal } from '@/components/BookingModal';
import { LogOut, ShieldCheck, Scissors, User } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, isLoading, sendOTP, verifyOTP, logout, updateUser } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<'register' | 'otp' | 'nombre'>('register');
  const [otp, setOtp] = useState("");
  const [nombre, setNombre] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [simulatedCode, setSimulatedCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.tipo === 'barbero') {
      router.push('/admin');
    }
    if (isAuthenticated && user?.tipo === 'cliente' && user?.nombre === 'Usuario Nuevo') {
      setStep('nombre');
    }
  }, [isAuthenticated, user, router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setSimulatedCode("");

    if (!/^\d{10}$/.test(phone)) {
      setErrorMsg("Ingresa un numero de 10 digitos valido.");
      return;
    }

    setIsSubmitting(true);
    const result = await sendOTP(phone);
    setIsSubmitting(false);

    if (result.success) {
      setStep('otp');
      setInfoMsg("Codigo enviado exitosamente.");
      if (result.simulatedOTP) setSimulatedCode(result.simulatedOTP);
    } else {
      setErrorMsg(result.error || "Ocurrio un error.");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg("Ingresa un codigo de 6 digitos.");
      return;
    }

    setIsSubmitting(true);
    const result = await verifyOTP(phone, otp, 'cliente');
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || "Codigo incorrecto.");
    }
  };

  const handleGuardarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (nombre.trim().length < 2) {
      setErrorMsg("Ingresa tu nombre completo.");
      return;
    }

    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/usuario', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id, nombre: nombre.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        updateUser({ nombre: nombre.trim() });
        setStep('register');
      } else {
        setErrorMsg(data.error || "Error al guardar el nombre.");
      }
    } catch {
      setErrorMsg("Error de conexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>Cargando aplicacion...</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    backgroundColor: '#111',
    color: 'white',
    width: '100%',
    outline: 'none',
    fontSize: '1rem',
  };

  // Paso: pedir nombre (usuario nuevo)
  if (isAuthenticated && step === 'nombre') {
    return (
      <main style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--color-bg)'
      }}>
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          padding: '2.5rem', width: '100%', maxWidth: '420px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'rgba(155,89,182,0.15)',
              border: '1px solid var(--color-primary)', marginBottom: '1rem'
            }}>
              <User color="var(--color-primary)" size={24} />
            </div>
            <h2 style={{ color: 'var(--color-primary)', fontSize: '1.6rem', marginBottom: '0.4rem' }}>
              Bienvenido!
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Como te llamas? Asi te identificaremos en tus citas.
            </p>
          </div>

          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid #e74c3c',
              borderRadius: '6px', padding: '12px', color: '#e74c3c',
              marginBottom: '1.5rem', fontSize: '0.9rem'
            }}>{errorMsg}</div>
          )}

          <form onSubmit={handleGuardarNombre} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                TU NOMBRE
              </label>
              <input
                type="text"
                placeholder="Ej. Carlos Perez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                required
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={nombre.trim().length < 2 || isSubmitting}
              style={{
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                gap: '10px', width: '100%',
                opacity: (nombre.trim().length < 2 || isSubmitting) ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Guardando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <main style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', padding: '2rem', backgroundColor: 'var(--color-bg)'
      }}>
        <div style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          padding: '2.5rem', width: '100%', maxWidth: '420px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <Scissors color="var(--color-primary)" size={28} />
              <h1 style={{ color: 'var(--color-primary)', fontSize: '2.2rem', letterSpacing: '-1px' }}>
                SmartBarber
              </h1>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              {step === 'register' ? 'Inicia sesion para reservar tu cita' : 'Verificacion de seguridad'}
            </p>
          </div>

          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(231,76,60,0.15)', border: '1px solid #e74c3c',
              borderRadius: '6px', padding: '12px', color: '#e74c3c',
              marginBottom: '1.5rem', fontSize: '0.9rem'
            }}>{errorMsg}</div>
          )}
          {infoMsg && (
            <div style={{
              backgroundColor: 'rgba(46,204,113,0.15)', border: '1px solid #2ecc71',
              borderRadius: '6px', padding: '12px', color: '#2ecc71',
              marginBottom: '1.5rem', fontSize: '0.9rem'
            }}>{infoMsg}</div>
          )}

          {step === 'register' ? (
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  NUMERO DE TELEFONO
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', fontWeight: 600
                  }}>+52</span>
                  <input
                    type="tel"
                    placeholder="(55) 1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={isSubmitting}
                    required
                    style={{ ...inputStyle, paddingLeft: '48px', letterSpacing: '1px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={phone.length < 10 || isSubmitting}
                style={{
                  marginTop: '0.5rem', display: 'flex', justifyContent: 'center',
                  alignItems: 'center', gap: '10px', width: '100%',
                  opacity: (phone.length < 10 || isSubmitting) ? 0.5 : 1
                }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Codigo SMS'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                Ingresa el codigo enviado a{' '}
                <span style={{ color: 'white', fontWeight: 600 }}>+52 {phone}</span>
              </p>

              {simulatedCode && (
                <div style={{
                  backgroundColor: 'rgba(155,89,182,0.1)',
                  border: '1px dashed var(--color-primary)',
                  borderRadius: '6px', padding: '12px',
                  color: 'var(--color-primary)', textAlign: 'center',
                  fontWeight: 'bold', letterSpacing: '1px'
                }}>
                  Codigo OTP Simulado: {simulatedCode}
                </div>
              )}

              <input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isSubmitting}
                required
                style={{ ...inputStyle, fontSize: '1.8rem', textAlign: 'center', letterSpacing: '10px' }}
              />

              <button
                type="submit"
                className="btn-primary"
                disabled={otp.length < 6 || isSubmitting}
                style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  gap: '10px', width: '100%',
                  opacity: (otp.length < 6 || isSubmitting) ? 0.5 : 1
                }}
              >
                {isSubmitting ? 'Verificando...' : 'Iniciar Sesion'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <button type="button" onClick={() => setStep('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                  Cambiar numero
                </button>
                <button type="button" onClick={handleSendOTP}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
                  Reenviar codigo
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    );
  }

  // Vista cliente autenticado
  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      minHeight: '100vh', padding: '4rem 2rem', backgroundColor: 'var(--color-bg)'
    }}>
      <div style={{
        width: '100%', maxWidth: '1000px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '4rem', flexWrap: 'wrap', gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck color="var(--color-primary)" size={24} />
          <span style={{ color: 'var(--color-text-muted)' }}>
            Sesion activa: <strong style={{ color: 'white' }}>{user?.nombre}</strong> ({user?.telefono})
          </span>
        </div>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#1c1c1e', color: 'var(--color-text)',
          border: '1px solid var(--color-border)', padding: '8px 16px',
          borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
        }}>
          <LogOut size={16} /> Cerrar Sesion
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-1px' }}>
          SmartBarber
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px' }}>
          Hola {user?.nombre}. Selecciona tu servicio y reserva tu cita en segundos.
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px', width: '100%', maxWidth: '1000px', marginBottom: '3rem'
      }}>
        <ServiceCard title="Corte Clasico" price="250" duration="40"
          description="Corte de cabello a tijera o maquina con acabados precisos y perfilado de cuello."
          onSelect={() => setSelectedService("Corte Clasico")} />
        <ServiceCard title="Arreglo de Barba" price="150" duration="30"
          description="Alineado, rebaje y tratamiento con toalla caliente y aceites esenciales."
          onSelect={() => setSelectedService("Arreglo de Barba")} />
        <ServiceCard title="Paquete Premium" price="350" duration="75"
          description="Corte completo, arreglo de barba VIP y facial express con mascarilla negra."
          onSelect={() => setSelectedService("Paquete Premium")} />
      </div>

      <BookingModal
        isOpen={selectedService !== null}
        serviceTitle={selectedService || ""}
        onClose={() => setSelectedService(null)}
      />
    </main>
  );
}