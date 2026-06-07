"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Estructura de datos del usuario autenticado
interface User {
  id: string;
  nombre: string;
  telefono: string;
  tipo: 'cliente' | 'barbero';
  fotoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOTP: (phone: string) => Promise<{ success: boolean; simulatedOTP?: string; error?: string }>;
  verifyOTP: (phone: string, otp: string, role: 'cliente' | 'barbero') => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  logout: () => void;
  updateUser: (fields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Leer sesión guardada en el cliente al iniciar la aplicación
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('sb_user');
      const savedToken = localStorage.getItem('sb_token');

      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.error("Error cargando sesión local:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Enviar petición de OTP al número telefónico indicado.
   */
  const sendOTP = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();

      if (res.ok) {
        return { success: true, simulatedOTP: data.simulatedOTP };
      } else {
        return { success: false, error: data.error || 'Ocurrió un error al enviar el código.' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión con el servidor.' };
    }
  };

  /**
   * Verificar código OTP e iniciar sesión local.
   */
  const verifyOTP = async (phone: string, otp: string, role: 'cliente' | 'barbero') => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('sb_user', JSON.stringify(data.user));
        localStorage.setItem('sb_token', data.token);
        return { success: true, isNewUser: data.isNewUser };
      } else {
        return { success: false, error: data.error || 'Código incorrecto o vencido.' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión con el servidor.' };
    }
  };

  /**
   * Cerrar la sesión del usuario.
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sb_user');
    localStorage.removeItem('sb_token');
  };
  const updateUser = (fields: Partial<User>) => {
  setUser(prev => {
    if (!prev) return prev;
    const updated = { ...prev, ...fields };
    localStorage.setItem('sb_user', JSON.stringify(updated));
    return updated;
    });
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      sendOTP,
      verifyOTP,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
