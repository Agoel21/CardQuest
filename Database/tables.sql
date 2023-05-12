DROP TABLE IF EXISTS [dbo].[Games];

CREATE TABLE [dbo].[Games]
(
    Id INT NOT NULL PRIMARY KEY IDENTITY,
    StartTime DATETIME,
    EndTime DATETIME,
    Winner VARCHAR(255)
);



