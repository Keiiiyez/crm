-- Script: add_products_table.sql
-- Crea la tabla `products` si no existe y añade la columna `operator` si falta

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

-- Si la tabla existe pero falta la columna `operator`, la añadimos (MySQL 8+ acepta IF NOT EXISTS)
ALTER TABLE products ADD COLUMN IF NOT EXISTS operator VARCHAR(100);

-- Añadimos algunos productos de ejemplo por operadora
INSERT INTO products (name, price, category, operator, type, fiber, landline, mobile_main_gb, mobile_main_speed, extra_lines, tv_package, streaming_services)
VALUES
('FIBRA 600MB + ILIMITADOS', 49.99, 'COMBO', 'VODAFONE', 'PORTABILIDAD', '600', 1, 'ILIMITADOS', '5G', JSON_ARRAY(), 'SIN TV', JSON_ARRAY('netflix')),
('FIBRA 300MB', 39.99, 'FIBRA_SOLA', 'MOVISTAR', 'ALTA NUEVA', '300', 1, NULL, NULL, JSON_ARRAY(), 'SIN TV', JSON_ARRAY()),
('COMBO 1GB + 50GB', 59.99, 'COMBO', 'ORANGE', 'PORTABILIDAD', '1', 1, '50GB', '5G', JSON_ARRAY(JSON_OBJECT('gb','25GB','speed','5G')), 'TV INICIAL', JSON_ARRAY('disney'));
