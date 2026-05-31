"use client";

import { useState } from 'react';
import { ServiceCard } from '@/components/ServiceCard';
import { BookingModal } from '@/components/BookingModal';

export default function Home() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '4rem 2rem'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ 
          color: 'var(--color-primary)', 
          fontSize: '3.5rem', 
          marginBottom: '1rem',
          letterSpacing: '-1px'
        }}>
          SmartBarber
        </h1>
        <p style={{ 
          color: 'var(--color-text-muted)', 
          fontSize: '1.2rem', 
          maxWidth: '600px',
        }}>
          Selecciona tu servicio y reserva tu cita en segundos.
        </p>
      </div>
      
      {/* Grill de Componentes (Nuestros Legos) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        width: '100%',
        maxWidth: '1000px',
        marginBottom: '3rem'
      }}>
        <ServiceCard 
          title="Corte Clásico" 
          price="250" 
          duration="40" 
          description="Corte de cabello a tijera o máquina con acabados precisos y perfilado de cuello."
          onSelect={() => setSelectedService("Corte Clásico")}
        />
        <ServiceCard 
          title="Arreglo de Barba" 
          price="150" 
          duration="30" 
          description="Alineado, rebaje y tratamiento con toalla caliente y aceites esenciales."
          onSelect={() => setSelectedService("Arreglo de Barba")}
        />
        <ServiceCard 
          title="Paquete Premium" 
          price="350" 
          duration="75" 
          description="Corte completo, arreglo de barba VIP y facial express con mascarilla negra."
          onSelect={() => setSelectedService("Paquete Premium")}
        />
      </div>

      <BookingModal 
        isOpen={selectedService !== null}
        serviceTitle={selectedService || ""}
        onClose={() => setSelectedService(null)}
      />
    </main>
  );
}
