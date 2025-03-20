-- Crear extensión pgcrypto si no existe (para funciones de hash)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear la tabla de empleados si no existe
CREATE TABLE IF NOT EXISTS public.employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cocina', 'empleado', 'cajero')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_employees_username ON public.employees(username);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);

-- Insertar un administrador por defecto con contraseña hasheada con bcrypt
INSERT INTO public.employees (name, username, password_hash, role, active)
VALUES (
  'Administrador', 
  'admin', 
  crypt('admin123', gen_salt('bf', 10)), -- Hash bcrypt para 'admin123'
  'admin', 
  true
)
ON CONFLICT (username) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso a todos los registros
CREATE POLICY "Allow full access to all users" ON public.employees
USING (true)
WITH CHECK (true);

