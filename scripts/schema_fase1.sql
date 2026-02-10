-- ==============================================================
-- FASE 1: Mejoras Críticas para Call Center
-- Tablas: Contratos, Cambios de Operadora, Comisiones y Auditoría
-- ==============================================================

-- 1. TABLA DE CONTRATOS
-- Registro completo de contratos activos/históricos
CREATE TABLE IF NOT EXISTS contratos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  numero_contrato VARCHAR(50) UNIQUE NOT NULL,
  operadora_origen VARCHAR(100),
  operadora_destino VARCHAR(100) NOT NULL,
  
  -- Servicios contratados
  tipo_contrato ENUM('PORTABILIDAD', 'NUEVA_LINEA', 'UPGRADE', 'RENOVACION') NOT NULL,
  servicios JSON NOT NULL, -- Array: [{nombre, precio, descripcion}]
  precio_total DECIMAL(10, 2) NOT NULL,
  
  -- Fechas importantes
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  fecha_renovacion DATE,
  fecha_cancelacion DATE,
  
  -- Estados del contrato
  estado ENUM(
    'PENDIENTE_TRAMITACION',      -- Esperando datos de portabilidad
    'EN_TRAMITACION',              -- Portabilidad en progreso
    'ACTIVO',                      -- Contrato activo
    'PROXIMO_VENCER',              -- Alerta: vence en 30 días
    'CANCELADO',                   -- Cancelado por cliente
    'CANCELADO_OPERADORA',         -- Cancelado por operadora
    'RENOVADO'                     -- Ya renovado (histórico)
  ) NOT NULL DEFAULT 'PENDIENTE_TRAMITACION',
  
  -- Datos de portabilidad (si aplica)
  datos_portabilidad JSON, -- {numero_linea, cuenta_cliente, autorizado}
  
  -- Auditoría básica
  asesor_id INT,
  asesor_nombre VARCHAR(100),
  notas TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_cliente (cliente_id),
  INDEX idx_estado (estado),
  INDEX idx_fecha_inicio (fecha_inicio),
  INDEX idx_numero_contrato (numero_contrato),
  INDEX idx_operadora_destino (operadora_destino)
);

-- 2. TABLA DE CAMBIOS EN OPERADORAS / PROMOCIONES SEMANALES
-- Permite trackear qué ofertas estuvieron vigentes cada semana
CREATE TABLE IF NOT EXISTS operadora_cambios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  operadora_nombre VARCHAR(100) NOT NULL,
  
  -- Datos de la oferta/promoción
  nombre_promocion VARCHAR(200) NOT NULL,
  descripcion TEXT,
  tipo_promocion ENUM('OFERTA_NUEVA', 'DESCUENTO', 'BONIFICACION', 'PORTABILIDAD', 'RENOVACION') NOT NULL,
  
  -- Precios y comisiones
  precio_base DECIMAL(10, 2) NOT NULL,
  precio_oferta DECIMAL(10, 2),
  comision_asesor DECIMAL(10, 2),
  comision_coordinador DECIMAL(10, 2),
  
  -- Validez de la promoción
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  es_vigente BOOLEAN DEFAULT TRUE,
  
  -- Servicios incluidos
  servicios JSON NOT NULL, -- {fibra: Mb, movil_gb: GB, tv, streaming: []}
  
  -- Control
  created_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_operadora (operadora_nombre),
  INDEX idx_fecha (fecha_inicio, fecha_fin),
  INDEX idx_vigente (es_vigente)
);

-- 3. TABLA DE COMISIONES POR VENTA
-- Registro detallado de comisiones generadas
CREATE TABLE IF NOT EXISTS comisiones_ventas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contrato_id INT NOT NULL,
  cliente_id INT NOT NULL,
  operadora VARCHAR(100) NOT NULL,
  
  -- Datos de la venta
  tipo_venta ENUM('PORTABILIDAD', 'NUEVA_LINEA', 'UPGRADE', 'RENOVACION', 'RECLAMACION') NOT NULL,
  fecha_venta DATE NOT NULL,
  
  -- Monto de venta y comisión
  precio_venta DECIMAL(10, 2) NOT NULL,
  porcentaje_comision DECIMAL(5, 2) NOT NULL,
  monto_comision DECIMAL(10, 2) NOT NULL,
  
  -- Asignación de comisiones
  asesor_id INT,
  asesor_nombre VARCHAR(100) NOT NULL,
  coordinador_id INT,
  coordinador_nombre VARCHAR(100),
  comision_asesor DECIMAL(10, 2),
  comision_coordinador DECIMAL(10, 2),
  
  -- Estado del pago
  estado_pago ENUM('PENDIENTE', 'PAGADA', 'DEDUCIDA', 'CANCELADA') DEFAULT 'PENDIENTE',
  fecha_pago DATE,
  numero_transferencia VARCHAR(50),
  
  -- Auditoría
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (contrato_id) REFERENCES contratos(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  INDEX idx_asesor (asesor_id),
  INDEX idx_operadora (operadora),
  INDEX idx_estado_pago (estado_pago),
  INDEX idx_fecha_venta (fecha_venta)
);

-- 4. TABLA DE AUDITORÍA - Registro de todos los cambios
-- Sistema de trazabilidad completa
CREATE TABLE IF NOT EXISTS auditoria_cambios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Acción realizada
  tabla_modificada VARCHAR(100) NOT NULL,
  registro_id INT NOT NULL,
  tipo_cambio ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  
  -- Datos antes y después
  valor_anterior JSON,
  valor_nuevo JSON,
  
  -- Usuario responsable
  usuario_id INT,
  usuario_nombre VARCHAR(100) NOT NULL,
  usuario_email VARCHAR(100),
  usuario_rol VARCHAR(50),
  
  -- Contexto
  razon_cambio VARCHAR(200),
  ip_address VARCHAR(45),
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tabla (tabla_modificada),
  INDEX idx_tipo (tipo_cambio),
  INDEX idx_usuario (usuario_id),
  INDEX idx_fecha (created_at),
  FULLTEXT INDEX ft_razon (razon_cambio)
);

-- 5. TABLA DE USUARIOS (para auditoría y acceso)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  
  rol ENUM('ASESOR', 'COORDINADOR', 'ADMIN', 'GERENTE') NOT NULL,
  operadora_asignada VARCHAR(100),
  
  estado ENUM('ACTIVO', 'INACTIVO', 'PERMISO') DEFAULT 'ACTIVO',
  
  fecha_contratacion DATE,
  comision_base DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_rol (rol),
  INDEX idx_operadora (operadora_asignada)
);

-- 6. TABLA DE HISTORIAL DE CAMBIOS DE SERVICIOS POR CLIENTE
-- Timeline completa de cambios
CREATE TABLE IF NOT EXISTS cliente_historial_servicios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  
  -- Cambio de servicio
  servicio_anterior VARCHAR(500),
  servicio_nuevo VARCHAR(500),
  operadora_origen VARCHAR(100),
  operadora_destino VARCHAR(100),
  
  -- Detalles
  tipo_cambio ENUM('PORTABILIDAD', 'UPGRADE', 'DOWNGRADE', 'CAMBIO_OPERADORA', 'AUMENTO_LINEAS') NOT NULL,
  razon_cambio VARCHAR(200), -- 'Mejor promoción', 'Mejor precio', etc.
  
  -- Comisión generada
  comision_generada DECIMAL(10, 2),
  
  -- Responsable
  asesor_nombre VARCHAR(100),
  
  -- Timestamp
  fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_cliente (cliente_id),
  INDEX idx_fecha (fecha_cambio)
);

-- 7. Actualizar tabla CONTRATOS con campos adicionales necesarios
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS version_contrato INT DEFAULT 1;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS vigencia_meses INT DEFAULT 24;
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS comision_total DECIMAL(10, 2) DEFAULT 0;

-- 8. Extender tabla CLIENTES con campos de call center
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cliente_desde DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS numero_contratos INT DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultimo_cambio_servicio DATE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS preferencia_comunicacion ENUM('LLAMADA', 'EMAIL', 'SMS', 'WHATSAPP') DEFAULT 'LLAMADA';
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS etiquetas JSON; -- ['VIP', 'FRECUENTE', 'RIESGO_CHURN']

-- Índices para optimizar búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_contratos_estado_fecha ON contratos(estado, fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_comisiones_asesor_estado ON comisiones_ventas(asesor_id, estado_pago);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_tabla ON auditoria_cambios(usuario_id, tabla_modificada);

-- Ver la estructura de las tablas
DESCRIBE contratos;
DESCRIBE operadora_cambios;
DESCRIBE comisiones_ventas;
DESCRIBE auditoria_cambios;
DESCRIBE usuarios;
DESCRIBE cliente_historial_servicios;

-- Tabla de productos/servicios (catálogo)
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  category VARCHAR(50),
  operator VARCHAR(100),
  type VARCHAR(100),
  fiber VARCHAR(50),
  landline TINYINT(1) DEFAULT 0,
  mobile_main_gb VARCHAR(50),
  mobile_main_speed VARCHAR(50),
  extra_lines JSON,
  tv_package VARCHAR(100) DEFAULT 'SIN TV',
  streaming_services JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_operator (operator)
);

