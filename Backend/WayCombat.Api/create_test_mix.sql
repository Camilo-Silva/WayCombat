-- Script para insertar el MIX 1 de prueba con datos reales
-- Audio MP3 track1.mp3 = https://drive.google.com/file/d/1HmRJahcntpMR_HPTQW6uXphWQ6nNVaM_/view?usp=drive_link
-- Video track1.mp4 = https://drive.google.com/file/d/1L3nPL5dTTmTIsVPHqPTcg_hToCTD0Eyv/view?usp=drive_link
-- YouTube URL: https://music.youtube.com/watch?v=-grPV-Fae6I&list=OLAK5uy_ljWDekJVUfMOYniqd1mZ8l45Q2nAwk4ds

-- Insertar el Mix
INSERT INTO Mixes (Titulo, Descripcion, FechaCreacion, FechaActualizacion, Activo)
VALUES ('MIX 1 - Test Real', 'Mix de prueba con archivos reales de Google Drive y YouTube Music', datetime('now'), datetime('now'), 1);

-- Obtener el ID del mix recién creado (asumiendo que es ID 4 si ya hay 3 mixs)
-- Insertar archivos del mix

-- 1. Audio MP3
INSERT INTO ArchivoMixes (MixId, Tipo, Nombre, URL, MimeType, TamañoBytes, Orden, FechaCreacion, FechaActualizacion, Activo)
VALUES (4, 'Audio', 'track1.mp3', 'https://drive.google.com/file/d/1HmRJahcntpMR_HPTQW6uXphWQ6nNVaM_/view?usp=drive_link', 'audio/mpeg', 8388608, 1, datetime('now'), datetime('now'), 1);

-- 2. Video MP4
INSERT INTO ArchivoMixes (MixId, Tipo, Nombre, URL, MimeType, TamañoBytes, Orden, FechaCreacion, FechaActualizacion, Activo)
VALUES (4, 'Video', 'track1.mp4', 'https://drive.google.com/file/d/1L3nPL5dTTmTIsVPHqPTcg_hToCTD0Eyv/view?usp=drive_link', 'video/mp4', 104857600, 2, datetime('now'), datetime('now'), 1);

-- 3. Video YouTube Music
INSERT INTO ArchivoMixes (MixId, Tipo, Nombre, URL, MimeType, TamañoBytes, Orden, FechaCreacion, FechaActualizacion, Activo)
VALUES (4, 'Video', 'Técnicas_Way_Combat_YouTube', 'https://music.youtube.com/watch?v=-grPV-Fae6I&list=OLAK5uy_ljWDekJVUfMOYniqd1mZ8l45Q2nAwk4ds', 'video/youtube', 0, 3, datetime('now'), datetime('now'), 1);

-- Dar acceso al usuario admin
INSERT INTO AccesoMixes (UsuarioId, MixId, FechaAcceso, Activo)
VALUES (1, 4, datetime('now'), 1);

-- Verificar que se insertó correctamente
SELECT 'Mix creado:' as tipo, Id, Titulo, Descripcion FROM Mixes WHERE Id = 4;
SELECT 'Archivos del mix:' as tipo, Id, Nombre, Tipo, URL FROM ArchivoMixes WHERE MixId = 4;
