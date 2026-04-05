-- Created by GitHub Copilot in SSMS - review carefully before executing

USE [master];
GO

-- 1. Crear el inicio de sesión (Login) a nivel de servidor
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = N'foodJet_backend')
BEGIN
    CREATE LOGIN foodJet_backend WITH PASSWORD = N'ContraseniaSegura.67!';
END
GO

USE [FoodjetBackend];
GO

-- 2. Crear el usuario en la base de datos asociado al Login
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = N'foodJet_backend')
BEGIN
    CREATE USER foodJet_backend FOR LOGIN foodJet_backend;
END
GO

-- 3. Asignar los roles para permitir operaciones CRUD
-- db_datareader otorga permisos SELECT en todas las tablas
ALTER ROLE [db_datareader] ADD MEMBER foodJet_backend;
GO

-- db_datawriter otorga permisos INSERT, UPDATE, DELETE en todas las tablas
ALTER ROLE [db_datawriter] ADD MEMBER foodJet_backend;
GO

-- Permitir al backend ejecutar cualquier Procedimiento Almacenado o Función actual o futura
GRANT EXECUTE TO foodJet_backend;
GO

-- Permitir al backend leer la estructura (metadata) de la base de datos (Útil para ORMs)
GRANT VIEW DEFINITION TO foodJet_backend;
GO