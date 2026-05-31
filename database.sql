-- ==========================================
-- SCRIPT DE INICIALIZACIÓN DE LA BASE DE DATOS
-- Gestor: PostgreSQL (via Supabase)
-- Proyecto: SmartBarber
-- ==========================================

-- 1. Tabla de Barberos (Personal)
CREATE TABLE barbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Servicios
CREATE TABLE services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Citas (Reservas / Bookings)
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL, -- Opcional: Si eligen un barbero específico
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'unverified', -- Puede ser: 'unverified', 'confirmed', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregando ejemplos básicos de servicios:
INSERT INTO services (title, description, price, duration_minutes) VALUES 
('Corte Clásico', 'Corte de cabello a tijera o máquina con perfilado', 250.00, 40),
('Arreglo de Barba', 'Alineado y tratamiento natural', 150.00, 30);
