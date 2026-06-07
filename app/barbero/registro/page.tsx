"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Scissors, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

export default function BarberoRegistro() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [simulatedCode, setSimulatedCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.tipo === 'barbero') router.push('/admin');
    if (isAuthenticated && user?.tipo === 'cliente') router.push('/');
  }, [isAuthenticated, user, router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setSimulatedCode("");

    if (!/^\d{10}$/.test(phone)) {
      setErrorMsg("Ingresa un número de 10 dígitos válido.");
      return;
    }

    if (!codigoInvitacion.trim()) {
      setErrorMsg("El código de invitación es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, codigoInvitacion: codigoInvitacion.trim().toUpperCase() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStep('otp');
        setInfoMsg("Código enviado. Verifica tu número para continuar.");
        if (data.simulatedOTP) setSimulatedCode(data.simulatedOTP);
      } else {
        setErrorMsg(data.error || "Ocurrió un error.");
      }
    } catch {
      setErrorMsg("Error de conexión con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg("Ingresa un código de 6 dígitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp,
          role: 'barbero',
          codigoInvitacion: codigoInvitacion.trim().toUpperCase()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('sb_user', JSON.stringify(data.user));
        localStorage.setItem('sb_token', data.token);
        router.push('/admin');
      } else {
        setErrorMsg(data.error || "Código incorrecto.");
      }
    } catch {
      setErrorMsg("Error de conexión con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-primary)' }}>Cargando...</p>
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
        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: 'var(--color-text-muted)', fontSize: '0.85rem',
          textDecoration: 'none', marginBottom: '1.5rem'
        }}>
          <ArrowLeft size={14} /> Volver al inicio
        </a>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: 'rgba(155,89,182,0.15)',
            border: '1px solid var(--color-primary)', marginBottom: '1rem'
          }}>
            <Scissors color="var(--color-primary)" size={24} />
          </div>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.8rem', letterSpacing: '-0.5px', marginBottom: '0.4rem' }}>
            Portal Barbero
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {step === 'register' ? 'Acceso exclusivo con código de invitación' : 'Verifica tu número para continuar'}
          </p>
        </div>

        {step === 'register' && (
          <div style={{
            backgroundColor: 'rgba(155,89,182,0.08)',
            border: '1px solid rgba(155,89,182,0.3)',
            borderRadius: '6px', padding: '10px 14px',
            marginBottom: '1.5rem', fontSize: '0.82rem',
            color: 'var(--color-text-muted)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <ShieldCheck size={14} color="var(--color-primary)" />
            Necesitas un código de invitación para registrarte
          </div>
        )}

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
          <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                CÓDIGO DE INVITACIÓN
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{
                  position: 'absolute', left: '14px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--color-primary)'
                }} />
                <input
                  type="text"
                  placeholder="BARBER-2026-XX"
                  value={codigoInvitacion}
                  onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                  required
                  style={{ ...inputStyle, paddingLeft: '42px', letterSpacing: '1px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                NÚMERO DE TELÉFONO
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
              disabled={phone.length < 10 || !codigoInvitacion.trim() || isSubmitting}
              style={{
                marginTop: '0.5rem', display: 'flex', justifyContent: 'center',
                alignItems: 'center', gap: '10px', width: '100%',
                opacity: (phone.length < 10 || !codigoInvitacion.trim() || isSubmitting) ? 0.5 : 1
              }}
            >
              {isSubmitting ? 'Validando...' : 'Continuar'}
            </button>

            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
              ¿Eres cliente?{' '}
              <a href="/" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Inicia sesión aquí →
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
              Ingresa el código enviado a{' '}
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
                Código OTP Simulado: {simulatedCode}
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
              {isSubmitting ? 'Verificando...' : 'Acceder al Panel'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <button type="button" onClick={() => { setStep('register'); setOtp(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                Cambiar número
              </button>
              <button type="button" onClick={handleSendOTP}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
                Reenviar código
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}