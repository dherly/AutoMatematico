-- schema.sql
DROP TABLE IF EXISTS results;

CREATE TABLE results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    timestamp REAL NOT NULL, -- Usamos REAL para guardar el timestamp de Unix
    operation TEXT NOT NULL, -- Ej: "3 x 4"
    selected_answer INTEGER NOT NULL, -- El número en el carril por el que pasó el coche
    correct_answer INTEGER NOT NULL, -- El resultado correcto
    score_change INTEGER NOT NULL -- 1 si fue correcto, 0 si fue incorrecto o se omitió
);