-- Verificar qué valores de rol existen en la tabla usuarios
SELECT DISTINCT rol, COUNT(*) as cantidad
FROM usuarios
GROUP BY rol
ORDER BY rol;
