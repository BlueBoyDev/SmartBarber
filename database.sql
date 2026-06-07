-- ==============================================================================
-- SCRIPT DE BASE DE DATOS - SMARTBARBER
-- Gestor: PostgreSQL (optimizado para Supabase)
-- Normalización: Tercera Forma Normal (3FN)
-- ==============================================================================

-- Habilitar extensión para generación de identificadores únicos UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpieza preventiva de tablas previas (respetando dependencias)
DROP TABLE IF EXISTS calificaciones CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS citas CASCADE;
DROP TABLE IF EXISTS servicios CASCADE;
DROP TABLE IF EXISTS barberos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS verificaciones_otp CASCADE;

-- ==========================================
-- 1. TABLA: usuarios
-- ==========================================
CREATE TABLE usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telefono VARCHAR(13) NOT NULL UNIQUE CHECK (telefono ~ '^\+[1-9]\d{1,14}$'), -- Formato E.164 (ej. +521234567890)
    nombre VARCHAR(100) NOT NULL,
    foto_url TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cliente', 'barbero')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. TABLA: barberos
-- ==========================================
CREATE TABLE barberos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,
    descripcion TEXT,
    rating_promedio DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_promedio BETWEEN 0.00 AND 5.00),
    direccion VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. TABLA: servicios
-- ==========================================
CREATE TABLE servicios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barbero_id UUID REFERENCES barberos(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    duracion_min INTEGER NOT NULL CHECK (duracion_min >= 15 AND duracion_min % 15 = 0), -- Bloques de 15 minutos
    precio DECIMAL(8,2) NOT NULL CHECK (precio >= 10.00), -- Mínimo $10 MXN
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. TABLA: citas
-- ==========================================
CREATE TABLE citas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    barbero_id UUID REFERENCES barberos(id) ON DELETE SET NULL,
    servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. TABLA: pagos
-- ==========================================
CREATE TABLE pagos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cita_id UUID REFERENCES citas(id) ON DELETE RESTRICT UNIQUE, -- Restrictivo para evitar borrar pagos auditables
    monto DECIMAL(8,2) NOT NULL CHECK (monto >= 0.00),
    metodo VARCHAR(20) NOT NULL CHECK (metodo IN ('tarjeta', 'spei', 'efectivo')),
    referencia_ext VARCHAR(100) UNIQUE, -- ID devuelto por Conekta
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'pagado', 'reembolsado', 'fallido')),
    pagado_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. TABLA: calificaciones
-- ==========================================
CREATE TABLE calificaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cita_id UUID REFERENCES citas(id) ON DELETE CASCADE UNIQUE, -- Una reseña por cita
    cliente_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    estrellas INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    comentario VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. TABLA: verificaciones_otp
-- ==========================================
CREATE TABLE verificaciones_otp (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telefono VARCHAR(13) NOT NULL,
    codigo_hash VARCHAR(64) NOT NULL,
    intentos INTEGER DEFAULT 0,
    expira_at TIMESTAMP WITH TIME ZONE NOT NULL,
    bloqueado_hasta TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- DISPARADORES (TRIGGERS) PARA LA INTEGRIDAD DE RATING
-- ==============================================================================

-- Función para calcular y actualizar el promedio de estrellas del barbero
CREATE OR REPLACE FUNCTION fn_update_barber_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_barbero_id UUID;
    v_avg_rating DECIMAL(3,2);
BEGIN
    -- Identificar el barbero asociado a la cita calificada
    IF (TG_OP = 'DELETE') THEN
        SELECT barbero_id INTO v_barbero_id FROM citas WHERE id = OLD.cita_id;
    ELSE
        SELECT barbero_id INTO v_barbero_id FROM citas WHERE id = NEW.cita_id;
    END IF;

    -- Calcular el promedio acumulado e introducir el cambio
    IF v_barbero_id IS NOT NULL THEN
        SELECT COALESCE(ROUND(AVG(estrellas), 2), 0.00) INTO v_avg_rating
        FROM calificaciones c
        JOIN citas ci ON c.cita_id = ci.id
        WHERE ci.barbero_id = v_barbero_id;

        UPDATE barberos
        SET rating_promedio = v_avg_rating
        WHERE id = v_barbero_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Disparador activado en eventos de la tabla calificaciones
CREATE TRIGGER trg_update_barber_rating
AFTER INSERT OR UPDATE OR DELETE ON calificaciones
FOR EACH ROW
EXECUTE FUNCTION fn_update_barber_rating();

-- ==========================================
-- ÍNDICES DE RENDIMIENTO (Performance Tuning)
-- ==========================================
-- Índices en llaves foráneas para acelerar los JOINs
CREATE INDEX idx_barberos_usuario_id ON barberos(usuario_id);
CREATE INDEX idx_servicios_barbero_id ON servicios(barbero_id);
CREATE INDEX idx_citas_cliente_id ON citas(cliente_id);
CREATE INDEX idx_citas_barbero_id ON citas(barbero_id);
CREATE INDEX idx_citas_servicio_id ON citas(servicio_id);
CREATE INDEX idx_pagos_cita_id ON pagos(cita_id);
CREATE INDEX idx_calificaciones_cita_id ON calificaciones(cita_id);

-- Índice temporal para las agendas de los barberos
CREATE INDEX idx_citas_fecha_hora ON citas(fecha_hora);

-- Índice para búsquedas rápidas de OTP
CREATE INDEX idx_verificaciones_otp_telefono ON verificaciones_otp(telefono);

-- ==========================================
-- SEGURIDAD (Row Level Security - RLS)
-- ==========================================
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificaciones_otp ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla: usuarios
CREATE POLICY "usuarios_public_select" ON usuarios FOR SELECT USING (true);
CREATE POLICY "usuarios_public_insert" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "usuarios_owner_update" ON usuarios FOR UPDATE USING (auth.uid() = id);

-- Políticas para la tabla: barberos
CREATE POLICY "barberos_public_select" ON barberos FOR SELECT USING (activo = true);
CREATE POLICY "barberos_owner_update" ON barberos FOR UPDATE USING (usuario_id = auth.uid());

-- Políticas para la tabla: servicios
CREATE POLICY "servicios_public_select" ON servicios FOR SELECT USING (activo = true);
CREATE POLICY "servicios_owner_all" ON servicios FOR ALL USING (
    barbero_id IN (SELECT id FROM barberos WHERE usuario_id = auth.uid())
);

-- Políticas para la tabla: citas
CREATE POLICY "citas_public_insert" ON citas FOR INSERT WITH CHECK (true);
CREATE POLICY "citas_relation_select" ON citas FOR SELECT USING (
    cliente_id = auth.uid() OR 
    barbero_id IN (SELECT id FROM barberos WHERE usuario_id = auth.uid())
);
CREATE POLICY "citas_relation_update" ON citas FOR UPDATE USING (
    cliente_id = auth.uid() OR 
    barbero_id IN (SELECT id FROM barberos WHERE usuario_id = auth.uid())
);

-- Políticas para la tabla: pagos
CREATE POLICY "pagos_public_insert" ON pagos FOR INSERT WITH CHECK (true);
CREATE POLICY "pagos_relation_select" ON pagos FOR SELECT USING (
    cita_id IN (
        SELECT id FROM citas WHERE 
        cliente_id = auth.uid() OR 
        barbero_id IN (SELECT id FROM barberos WHERE usuario_id = auth.uid())
    )
);

-- Políticas para la tabla: calificaciones
CREATE POLICY "calificaciones_public_select" ON calificaciones FOR SELECT USING (true);
CREATE POLICY "calificaciones_owner_insert" ON calificaciones FOR INSERT WITH CHECK (
    cliente_id = auth.uid()
);

-- Políticas para la tabla: verificaciones_otp
CREATE POLICY "verificaciones_otp_public_insert" ON verificaciones_otp FOR INSERT WITH CHECK (true);
CREATE POLICY "verificaciones_otp_public_select" ON verificaciones_otp FOR SELECT USING (true);
CREATE POLICY "verificaciones_otp_public_update" ON verificaciones_otp FOR UPDATE USING (true);

-- ==========================================
-- TIEMPO REAL (Supabase Realtime)
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE citas;

-- ==========================================
-- SEMILLAS / DATOS DEMO (Seed Data)
-- ==========================================

-- 1. Insertar Usuarios
-- Contiene barberos y clientes de prueba
INSERT INTO usuarios (id, telefono, nombre, tipo) VALUES 
('b1111111-1111-1111-1111-111111111111', '+525511111111', 'Don Cleto', 'barbero'),
('b2222222-2222-2222-2222-222222222222', '+525522222222', 'Sebastián Ramos', 'barbero'),
('b3333333-3333-3333-3333-333333333333', '+525533333333', 'Marcos Luna', 'barbero'),
('c1111111-1111-1111-1111-111111111111', '+525544444444', 'Carlos P.', 'cliente'),
('c2222222-2222-2222-2222-222222222222', '+525555555555', 'Jorge García', 'cliente'),
('c3333333-3333-3333-3333-333333333333', '+525566666666', 'Armando Robles', 'cliente');

-- 2. Insertar Barberos
INSERT INTO barberos (id, usuario_id, descripcion, direccion, lat, lng) VALUES 
('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Afeitado tradicional a navaja y arreglo de barba premium.', 'Av. Hidalgo 120, Col. Centro, Guadalajara, Jal.', 20.6766, -103.3475),
('a2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Estilos modernos, desvanecidos (fades) y colorimetría.', 'Av. Juárez 450, Col. Americana, Guadalajara, Jal.', 20.6741, -103.3568),
('a3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Cortes clásicos de tijera y perfilado infantil.', 'Av. Chapultepec 80, Col. Lafayete, Guadalajara, Jal.', 20.6725, -103.3688);

-- 3. Insertar Servicios
-- Distribuidos en los respectivos catálogos de los barberos
INSERT INTO servicios (id, barbero_id, nombre, duracion_min, precio) VALUES 
('e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Arreglo de Barba', 30, 150.00),
('e2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Corte Clásico', 45, 250.00),
('e3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Paquete Premium', 75, 350.00);

-- 4. Insertar Citas (Ejemplos históricos y del día actual)
INSERT INTO citas (id, cliente_id, barbero_id, servicio_id, fecha_hora, estado, notas) VALUES 
('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', CURRENT_DATE + TIME '10:00:00', 'confirmada', 'Corte clásico con fade alto.'),
('d2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', CURRENT_DATE + TIME '11:00:00', 'confirmada', 'Arreglo de barba con toalla caliente.'),
('d3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', CURRENT_DATE + TIME '12:30:00', 'completada', 'Sin notas.');

-- 5. Insertar Pagos
INSERT INTO pagos (cita_id, monto, metodo, referencia_ext, estado, pagado_at) VALUES 
('d1111111-1111-1111-1111-111111111111', 250.00, 'tarjeta', 'conekta_charge_99812', 'pagado', NOW()),
('d2222222-2222-2222-2222-222222222222', 150.00, 'spei', 'conekta_spei_88716', 'pagado', NOW()),
('d3333333-3333-3333-3333-333333333333', 350.00, 'efectivo', NULL, 'pagado', NOW());

-- 6. Insertar Calificaciones (Esto activará el trigger y actualizará el rating_promedio de los barberos)
INSERT INTO calificaciones (cita_id, cliente_id, estrellas, comentario) VALUES 
('d3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 5, 'Excelente servicio de corte clásico, muy profesional Marcos Luna.');
