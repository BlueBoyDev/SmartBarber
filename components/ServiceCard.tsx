"use client";

import { Scissors } from 'lucide-react';
import React from 'react';

interface ServiceCardProps {
  title: string;
  price: string;
  duration: string;
  description: string;
  onSelect?: () => void;
}

export function ServiceCard({ title, price, duration, description, onSelect }: ServiceCardProps) {
  // En Next.js usamos "use client" arriba cuando un componente necesita interactividad (como detectar el mouse)
  
  return (
    <div 
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--border-radius)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        transition: 'var(--transition)',
        width: '100%',
        margin: '10px 0'
      }}
      // Eventos de react para lograr interactividad dinámica:
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ padding: '8px', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px' }}>
          <Scissors color="var(--color-primary)" size={24} />
        </div>
        <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
          ${price}
        </span>
      </div>
      <h3 style={{ fontSize: '1.5rem', marginTop: '10px' }}>{title}</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '15px' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>⏱ {duration} min</span>
        <button 
          onClick={onSelect}
          style={{ 
          background: 'transparent', 
          border: '1px solid var(--color-primary)', 
          color: 'var(--color-primary)',
          padding: '6px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}>
          Elegir
        </button>
      </div>
    </div>
  );
}
