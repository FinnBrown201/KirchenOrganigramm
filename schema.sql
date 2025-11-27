-- schema.sql
-- PostgreSQL-Schema für die katholische Kirche

DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES roles(id)
);

INSERT INTO roles (name, parent_id) VALUES
('Papst', NULL),            -- oberste Ebene
('Kardinal', 1),
('Erzbischof', 2),
('Bischof', 3),
('Pfarrer', 4),
('Diakon', 5),
('Gläubige/r', 6);
