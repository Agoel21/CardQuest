use master

DROP DATABASE IF EXISTS games

    CREATE TABLE games
    (
        Id INT NOT NULL PRIMARY KEY IDENTITY,
        StartTime DATETIME,
        EndTime DATETIME,
        Winner VARCHAR(255)
    )




