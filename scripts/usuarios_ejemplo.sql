-- Script para crear usuarios de ejemplo para pruebas

-- Asegúrate de que tienes la tabla usuarios (se creó en FASE 1)
-- Si no la tienes, ejecuta primero: scripts/schema_fase1.sql

-- Limpiar usuarios de ejemplo previos (opcional)
-- DELETE FROM usuarios WHERE email LIKE '%@example.com';

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, email, telefono, rol, operadora_asignada, estado, comision_base) VALUES 

-- ADMIN - Acceso total al sistema
('Admin System', 'admin@example.com', '600000001', 'ADMIN', NULL, 'ACTIVO', NULL),

-- ASESORES - Solo registran ventas
('Juan Pérez', 'juan@example.com', '600000101', 'ASESOR', 'Movistar', 'ACTIVO', 5.0),
('Carlos García', 'carlos@example.com', '600000102', 'ASESOR', 'Vodafone', 'ACTIVO', 5.0),
('Ana Martínez', 'ana@example.com', '600000103', 'ASESOR', 'Orange', 'ACTIVO', 5.0),

-- COORDINADORES - Supervisan asesores
('María López', 'maria@example.com', '600000201', 'COORDINADOR', 'Movistar', 'ACTIVO', 2.5),
('Pedro Sánchez', 'pedro@example.com', '600000202', 'COORDINADOR', 'Vodafone', 'ACTIVO', 2.5),

-- GERENTE - Casi acceso total
('Roberto Díaz', 'roberto@example.com', '600000301', 'GERENTE', NULL, 'ACTIVO', 1.0);

-- Verificar que se insertaron correctamente
SELECT id, nombre, email, rol, operadora_asignada, estado FROM usuarios WHERE email LIKE '%@example.com' ORDER BY rol;

-- NOTAS DE PRUEBA:
-- - Password en demo es: (ver INTEGRACION_ROLES_Y_PERMISOS.md)
-- - En producción: usar bcrypt para hashear passwords
-- - Cada usuario debe tener una contraseña única en BD
-- - Los roles pueden tener operadoras asignadas (para filtrar datos)
-- - comision_base es el % base de comisión para ese usuario

-- Scripts útiles:
-- Ver todos los usuarios:
-- SELECT * FROM usuarios;

-- Cambiar rol de un usuario:
-- UPDATE usuarios SET rol = 'ADMIN' WHERE email = 'juan@example.com';

-- Desactivar un usuario:
-- UPDATE usuarios SET estado = 'INACTIVO' WHERE email = 'juan@example.com';

-- Ver auditoría de un usuario:
-- SELECT * FROM auditoria_cambios WHERE usuario_id = 1 ORDER BY created_at DESC;
