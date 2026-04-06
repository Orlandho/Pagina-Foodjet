-- Creación del usuario (rol) para el backend
CREATE USER foodjet_user WITH PASSWORD 'foodjet_password';

-- Asignar privilegios sobre la base de datos FoodjetBackend al usuario
GRANT ALL PRIVILEGES ON DATABASE "FoodjetBackend" TO foodjet_user;

-- También suele ser necesario dar permisos sobre el schema public
-- Asegúrate de conectarte a la base de datos FoodjetBackend antes de ejecutar esto:
-- \c FoodjetBackend
-- GRANT ALL ON SCHEMA public TO foodjet_user;
