-- Función para crear la tabla de límites de tasa
CREATE OR REPLACE FUNCTION create_rate_limit_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Crear la tabla si no existe
  CREATE TABLE IF NOT EXISTS public.rate_limits (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL,
    timestamp BIGINT NOT NULL
  );
  
  -- Crear índice para búsquedas rápidas
  CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
  CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON public.rate_limits(timestamp);
  
  -- Habilitar RLS
  ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
  
  -- Crear política para permitir acceso
  DROP POLICY IF EXISTS "Allow full access to all users" ON public.rate_limits;
  CREATE POLICY "Allow full access to all users" ON public.rate_limits
    USING (true)
    WITH CHECK (true);
END;
$$;

