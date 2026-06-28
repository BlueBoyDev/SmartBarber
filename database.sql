-- ==============================================================================
-- SMARTBARBER - SCRIPT DE BASE DE DATOS UNIFICADO
-- Incluye: Tablas base, OTP, Horarios y Datos Semilla
-- ==============================================================================

-- 1. Habilitar extensión para generar UUIDs automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TABLAS INDEPENDIENTES
-- ==============================================================================

CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  telefono character varying NOT NULL UNIQUE CHECK (telefono::text ~ '^\+[1-9]\d{1,14}$'::text),
  nombre character varying NOT NULL,
  foto_url text,
  tipo character varying NOT NULL CHECK (tipo::text = ANY (ARRAY['cliente'::character varying, 'barbero'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);

CREATE TABLE public.verificaciones_otp (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  telefono character varying NOT NULL,
  codigo_hash character varying NOT NULL,
  intentos integer DEFAULT 0,
  expira_at timestamp with time zone NOT NULL,
  bloqueado_hasta timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT verificaciones_otp_pkey PRIMARY KEY (id)
);

CREATE TABLE public.codigos_invitacion (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  codigo character varying NOT NULL UNIQUE,
  usado boolean DEFAULT false,
  usado_por character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT codigos_invitacion_pkey PRIMARY KEY (id)
);

-- ==============================================================================
-- TABLAS DE PRIMER NIVEL DE DEPENDENCIA
-- ==============================================================================

CREATE TABLE public.barberos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  usuario_id uuid UNIQUE,
  descripcion text,
  rating_promedio numeric DEFAULT 0.00 CHECK (rating_promedio >= 0.00 AND rating_promedio <= 5.00),
  direccion character varying NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT barberos_pkey PRIMARY KEY (id),
  CONSTRAINT barberos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);

-- ==============================================================================
-- TABLAS DE SEGUNDO NIVEL DE DEPENDENCIA (Dependen de Barberos)
-- ==============================================================================

CREATE TABLE public.servicios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  barbero_id uuid,
  nombre character varying NOT NULL,
  duracion_min integer NOT NULL CHECK (duracion_min >= 15 AND (duracion_min % 15) = 0),
  precio numeric NOT NULL CHECK (precio >= 10.00),
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT servicios_pkey PRIMARY KEY (id),
  CONSTRAINT servicios_barbero_id_fkey FOREIGN KEY (barbero_id) REFERENCES public.barberos(id)
);

CREATE TABLE public.horario_base (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  barbero_id uuid,
  dia_semana smallint NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio time without time zone NOT NULL,
  hora_fin time without time zone NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT horario_base_pkey PRIMARY KEY (id),
  CONSTRAINT horario_base_barbero_id_fkey FOREIGN KEY (barbero_id) REFERENCES public.barberos(id)
);

CREATE TABLE public.horarios_bloqueados (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  barbero_id uuid,
  fecha date NOT NULL,
  hora_inicio time without time zone,
  hora_fin time without time zone,
  motivo character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT horarios_bloqueados_pkey PRIMARY KEY (id),
  CONSTRAINT horarios_bloqueados_barbero_id_fkey FOREIGN KEY (barbero_id) REFERENCES public.barberos(id)
);

-- ==============================================================================
-- TABLAS TRANSACCIONALES CORE
-- ==============================================================================

CREATE TABLE public.citas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid,
  barbero_id uuid,
  servicio_id uuid,
  fecha_hora timestamp with time zone NOT NULL,
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'confirmada'::character varying, 'en_curso'::character varying, 'completada'::character varying, 'cancelada'::character varying]::text[])),
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT citas_pkey PRIMARY KEY (id),
  CONSTRAINT citas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.usuarios(id),
  CONSTRAINT citas_barbero_id_fkey FOREIGN KEY (barbero_id) REFERENCES public.barberos(id),
  CONSTRAINT citas_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicios(id)
);

-- ==============================================================================
-- TABLAS FINALES (Dependen de Citas)
-- ==============================================================================

CREATE TABLE public.pagos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cita_id uuid UNIQUE,
  monto numeric NOT NULL CHECK (monto >= 0.00),
  metodo character varying NOT NULL CHECK (metodo::text = ANY (ARRAY['tarjeta'::character varying, 'spei'::character varying, 'efectivo'::character varying]::text[])),
  referencia_ext character varying UNIQUE,
  estado character varying NOT NULL CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'pagado'::character varying, 'reembolsado'::character varying, 'fallido'::character varying]::text[])),
  pagado_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.citas(id)
);

CREATE TABLE public.calificaciones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cita_id uuid UNIQUE,
  cliente_id uuid,
  estrellas integer NOT NULL CHECK (estrellas >= 1 AND estrellas <= 5),
  comentario character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calificaciones_pkey PRIMARY KEY (id),
  CONSTRAINT calificaciones_cita_id_fkey FOREIGN KEY (cita_id) REFERENCES public.citas(id),
  CONSTRAINT calificaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.usuarios(id)
);

-- ==============================================================================
-- DATOS SEMILLA (SEED DATA)
-- ==============================================================================

-- 1. Crear un usuario (Tipo Barbero)
INSERT INTO public.usuarios (id, telefono, nombre, foto_url, tipo) 
VALUES ('c4b1897e-1234-4000-8000-111111111111', '+525555555555', 'Ricardo Barbero', 'https://ui-avatars.com/api/?name=Ricardo+B', 'barbero');

-- 2. Enlazar ese usuario en la tabla de barberos
INSERT INTO public.barberos (id, usuario_id, descripcion, rating_promedio, direccion, lat, lng, activo)
VALUES ('b4b1897e-1234-4000-8000-222222222222', 'c4b1897e-1234-4000-8000-111111111111', 'Barbero experto con 10 años de experiencia', 5.00, 'Centro, CDMX', 19.4326, -99.1332, true);

-- 3. Agregar un par de servicios para que puedas probar las citas
INSERT INTO public.servicios (barbero_id, nombre, duracion_min, precio, activo)
VALUES 
('b4b1897e-1234-4000-8000-222222222222', 'Corte Clásico', 30, 200.00, true),
('b4b1897e-1234-4000-8000-222222222222', 'Arreglo de Barba', 15, 150.00, true);

-- 4. Darle un horario de trabajo (Lunes a Viernes de 9am a 6pm)
INSERT INTO public.horario_base (barbero_id, dia_semana, hora_inicio, hora_fin, activo)
VALUES
('b4b1897e-1234-4000-8000-222222222222', 1, '09:00:00', '18:00:00', true),
('b4b1897e-1234-4000-8000-222222222222', 2, '09:00:00', '18:00:00', true),
('b4b1897e-1234-4000-8000-222222222222', 3, '09:00:00', '18:00:00', true),
('b4b1897e-1234-4000-8000-222222222222', 4, '09:00:00', '18:00:00', true),
('b4b1897e-1234-4000-8000-222222222222', 5, '09:00:00', '18:00:00', true);
