-- ==============================================================================
-- SCRIPT INCREMENTAL: TABLA DE VERIFICACIONES OTP
-- Proyecto: SmartBarber
-- ==============================================================================

CREATE TABLE IF NOT EXISTS verificaciones_otp (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telefono VARCHAR(13) NOT NULL,
    codigo_hash VARCHAR(64) NOT NULL,
    intentos INTEGER DEFAULT 0,
    expira_at TIMESTAMP WITH TIME ZONE NOT NULL,
    bloqueado_hasta TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por teléfono
CREATE INDEX IF NOT EXISTS idx_verificaciones_otp_telefono ON verificaciones_otp(telefono);

-- Habilitar Row Level Security (RLS) por seguridad
ALTER TABLE verificaciones_otp ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para verificaciones_otp
CREATE POLICY "Permitir inserción pública de verificaciones" ON verificaciones_otp FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir consulta pública de verificaciones" ON verificaciones_otp FOR SELECT USING (true);
CREATE POLICY "Permitir actualización pública de verificaciones" ON verificaciones_otp FOR UPDATE USING (true);
