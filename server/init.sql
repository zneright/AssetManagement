-- AssetTrackerDB Initialization Script
-- Creates the database, Users table, and Assets table.

-- Create database if wala pa
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'AssetTrackerDB')
BEGIN
    CREATE DATABASE AssetTrackerDB;
END
GO

USE AssetTrackerDB;
GO

-- Create Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Username NVARCHAR(50) NOT NULL UNIQUE,
        Password NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Create Assets table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Assets')
BEGIN
    CREATE TABLE Assets (
        Id INT PRIMARY KEY IDENTITY(1,1),
        AssetName NVARCHAR(100) NOT NULL,
        Category NVARCHAR(50) NOT NULL,
        SerialNumber NVARCHAR(100) NOT NULL UNIQUE,
        Status NVARCHAR(50) NOT NULL,
        EstimatedValue DECIMAL(18,2) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO
