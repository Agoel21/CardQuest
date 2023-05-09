IF NOT EXISTS (SELECT name
FROM sys.databases
WHERE name = 'gamecard')
BEGIN
    CREATE DATABASE [gamecard]
END
GO

USE [gamecard]
GO

IF NOT EXISTS (SELECT *
FROM sys.tables
WHERE name = 'games')
BEGIN
    CREATE TABLE games
    (
        Id INT NOT NULL PRIMARY KEY IDENTITY,
        StartTime DATETIME,
        EndTime DATETIME,
        Winner VARCHAR(255)
    )
END



