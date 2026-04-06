-- Creación del usuario (rol) para el backend
CREATE USER foodjet_user WITH PASSWORD 'foodjet_password';

-- Asignar privilegios sobre la base de datos FoodjetBackend al usuario
GRANT ALL PRIVILEGES ON DATABASE "FoodjetBackend" TO foodjet_user;

-- También suele ser necesario dar permisos sobre el schema public
-- Asegúrate de conectarte a la base de datos FoodjetBackend antes de ejecutar esto:
-- \c FoodjetBackend
-- GRANT ALL ON SCHEMA public TO foodjet_user;
-- Dar permiso de uso sobre el esquema público
GRANT USAGE ON SCHEMA public TO foodjet_user;

-- Dar permisos en TODAS las tablas existentes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO foodjet_user;

-- Dar permisos en las secuencias (para que pueda generar IDs autoincrementales)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO foodjet_user;

-- Asegurar que las futuras tablas también tengan estos permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO foodjet_user;