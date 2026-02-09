# Scripts de Base de Datos

## schema_fase1.sql

Contiene todas las tablas necesarias para la **FASE 1** de mejoras del CRM:

### Tablas incluidas:
1. `contratos` - Gestión de contratos
2. `operadora_cambios` - Promociones semanales de operadoras
3. `comisiones_ventas` - Comisiones por venta
4. `auditoria_cambios` - Sistema de auditoría
5. `usuarios` - Gestión de usuarios
6. `cliente_historial_servicios` - Historial de cambios

### Cómo ejecutar:

#### Opción 1: Línea de comandos
```bash
mysql -u root -p crm < schema_fase1.sql
```

#### Opción 2: MySQL Workbench
1. File → Open SQL Script → Selecciona schema_fase1.sql
2. Ctrl+Shift+Enter para ejecutar

#### Opción 3: phpMyAdmin
1. Selecciona BD "crm"
2. Tab "Import" → Selecciona schema_fase1.sql
3. Click "Import"

### Verificación:
Después de ejecutar, verifica que todas las tablas existan:
```sql
SHOW TABLES;
```

Deberías ver estas nuevas tablas:
- contratos
- operadora_cambios
- comisiones_ventas
- auditoria_cambios
- usuarios
- cliente_historial_servicios
