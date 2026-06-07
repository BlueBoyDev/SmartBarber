"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Scissors, ArrowLeft } from 'lucide-react';

export default function BarberoLogin() {
  const { user, isAuthenticated, isLoading, sendOTP, verifyOTP } = useAuth();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<'login' | 'otp'>('login');
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

    if (!/^\d{6}$/.test(otp)) {
      setErrorMsg("Ingresa un codigo de 6 digitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role: 'barbero' })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('sb_user', JSON.stringify(data.user));
        localStorage.setItem('sb_token', data.token);
        window.location.href = '/admin';  // ✅ recarga completa, contexto se inicializa
        } else {
        setErrorMsg(data.error || "Codigo incorrecto.");
      }
    } catch {
      setErrorMsg("Error de conexion con el servidor.");
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
            Acceso Barbero
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {step === 'login' ? 'Inicia sesion en tu panel de control' : 'Verifica tu numero para continuar'}
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

        {step === 'login' ? (
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

            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
              No tienes cuenta?{' '}
              <a href="/barbero/registro" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Registrate aqui
              </a>
            </p>
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
              {isSubmitting ? 'Verificando...' : 'Acceder al Panel'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <button type="button" onClick={() => { setStep('login'); setOtp(''); }}
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