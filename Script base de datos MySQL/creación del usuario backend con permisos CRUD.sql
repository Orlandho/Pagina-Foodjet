CREATE DATABASE IF NOT EXISTS FoodjetBackend;
USE FoodjetBackend;

-- 1. Crear el usuario (si no existe) y asignar contraseña
CREATE USER IF NOT EXISTS 'foodJet_backend'@'localhost' IDENTIFIED BY 'ContraseniaSegura.67!';
CREATE USER IF NOT EXISTS 'foodJet_backend'@'%' IDENTIFIED BY 'ContraseniaSegura.67!';

-- 2. Asignar privilegios (CRUD y de ejecución/estructura) sobre la base de datos
GRANT SELECT, INSERT, UPDATE, DELETE ON FoodjetBackend.* TO 'foodJet_backend'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON FoodjetBackend.* TO 'foodJet_backend'@'%';

-- Equivalente a GRANT EXECUTE y GRANT VIEW DEFINITION en MySQL (rutinas y vistas)
GRANT EXECUTE, SHOW VIEW ON FoodjetBackend.* TO 'foodJet_backend'@'localhost';
GRANT EXECUTE, SHOW VIEW ON FoodjetBackend.* TO 'foodJet_backend'@'%';

-- Aplicar los cambios de privilegios
FLUSH PRIVILEGES;
