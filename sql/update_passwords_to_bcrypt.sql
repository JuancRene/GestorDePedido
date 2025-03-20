-- Este script debe ejecutarse manualmente en la consola SQL de Supabase
-- para actualizar las contraseñas existentes al formato bcrypt

-- Primero, vamos a crear una función para hashear contraseñas con bcrypt
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  salt TEXT;
  hashed_password TEXT;
BEGIN
  -- En PostgreSQL no tenemos bcrypt nativo, así que simulamos el hash
  -- En una implementación real, esto se haría desde el backend
  salt := gen_random_uuid();
  hashed_password := crypt(password, gen_salt('bf', 10));
  RETURN hashed_password;
END;
$$;

-- Ahora, vamos a actualizar las contraseñas de los usuarios existentes
-- NOTA: Esto es solo para demostración. En un entorno real, necesitaríamos
-- conocer las contraseñas originales para hashearlas correctamente.

-- Actualizar el administrador por defecto
UPDATE employees
SET password_hash = hash_password('admin123')
WHERE username = 'admin' AND password_hash LIKE '%salt_value%';

-- Actualizar otros usuarios de prueba si existen
UPDATE employees
SET password_hash = hash_password('juan123')
WHERE username = 'juan' AND password_hash LIKE '%salt_value%';

UPDATE employees
SET password_hash = hash_password('tito123')
WHERE username = 'tito' AND password_hash LIKE '%salt_value%';

UPDATE employees
SET password_hash = hash_password('chef123')
WHERE username = 'chef' AND password_hash LIKE '%salt_value%';

-- Añadir un usuario de prueba con contraseña hasheada si no existe
INSERT INTO employees (name, username, password_hash, role, active)
VALUES (
  'Usuario de Prueba', 
  'test', 
  hash_password('test123'),
  'empleado', 
  true
)
ON CONFLICT (username) DO NOTHING;

