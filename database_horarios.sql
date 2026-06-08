-- ==============================================================================
-- HORARIOS DEL BARBERO - SMARTBARBER
-- Ejecutar en Supabase SQL Editor
-- ==============================================================================

-- 1. Tabla de jornada base del barbero (horario de trabajo normal)
CREATE TABLE IF NOT EXISTS horario_base (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barbero_id UUID REFERENCES barberos(id) ON DELETE CASCADE,
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Dom, 1=Lun ... 6=Sáb
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(barbero_id, dia_semana)
);

-- 2. Tabla de bloqueos (días completos o franjas horarias)
CREATE TABLE IF NOT EXISTS horarios_bloqueados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    barbero_id UUID REFERENCES barberos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    hora_inicio TIME,         -- NULL = día completo bloqueado
    hora_fin TIME,            -- NULL = día completo bloqueado
    motivo VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_horario_base_barbero
    ON horario_base(barbero_id);

CREATE INDEX IF NOT EXISTS idx_horarios_bloqueados_barbero_fecha
    ON horarios_bloqueados(barbero_id, fecha);

-- ==============================================================================
-- ROW LEVEL SECURITY
-- Las tablas solo son accesibles desde el backend con la Service Role Key.
-- La clave anon/authenticated NO puede leer ni escribir directamente.
-- ==============================================================================

ALTER TABLE horario_base        ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_bloqueados ENABLE ROW LEVEL SECURITY;

-- Solo el service_role (backend) tiene acceso total.
-- El cliente nunca accede a Supabase directamente; todo pasa por las API Routes.

CREATE POLICY "service_role_horario_base"
    ON horario_base
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "service_role_horarios_bloqueados"
    ON horarios_bloqueados
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
