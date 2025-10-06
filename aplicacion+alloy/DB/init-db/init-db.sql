-- Script de inicialización de base de datos
-- Crear la base de datos
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'AutosDB')
BEGIN
    CREATE DATABASE AutosDB;
END
GO

-- Usar la base de datos
USE AutosDB;
GO

-- Crear la tabla de Autos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Autos')
BEGIN
    CREATE TABLE Autos (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Modelo NVARCHAR(100) NOT NULL,
        Marca NVARCHAR(100) NOT NULL,
        Anio INT NOT NULL,
        FechaRegistro DATETIME DEFAULT GETDATE()
    );
END
GO

-- Insertar algunos datos de ejemplo
INSERT INTO Autos (Modelo, Marca, Anio) VALUES 
    ('Corolla', 'Toyota', 2023),
    ('Civic', 'Honda', 2022),
    ('Mustang', 'Ford', 2024),
    ('Model 3', 'Tesla', 2023),
    ('Golf', 'Volkswagen', 2022);
GO

-- Crear índices para mejorar el rendimiento
CREATE INDEX IX_Autos_Marca ON Autos(Marca);
CREATE INDEX IX_Autos_Anio ON Autos(Anio);
GO

PRINT 'Base de datos y tabla creadas exitosamente';
GO