export type Client = {
  id: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  operator?: string;
  postalCode: string;
  registrationDate: string;
  iban?: string;
  nationality?: string;
  avatarUrl?: string;   
  new_operator?: string;  
  status?: "en proceso" | "instalación" | "completa"; 
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
};

export type Operator = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  hireDate: string;
  avatarUrl?: string;
};

export type Sale = {
  id: string;
  clientName: string;
  productName: string;
  operatorName: string;
  saleDate: string;
  amount: number;
  status: "pendiente" | "en proceso" | "completa"; 
};

export type Venta = {
  id: string;
  grupo?: string;
  mesVta?: string;
  carga?: string;
  distri?: string;
  gestion?: string;
  segmento?: string;
  asesor?: string;
  coordinacion?: string;
  colaborador?: string;
  campana?: string;
  cliente: string;
  dni: string;
  tlfContacto: string;
  historicoCliente?: string;
  ofrecimientoComercial?: string;
  pack?: string;
  promo?: string;
  tec?: string;
  huella?: string;
  tipo?: string;
  servicios?: string;
  numero?: string;
  operador: string;
  tipoDeLinea?: string;
  estado: string; 
  subestado?: string;
  mesAct?: string;
  fchaAct: Date;
  datosPortabilidad?: string;
  docAdicEnCrm?: boolean;
  zona?: string;
  fchaBaja?: Date;
  direccion: string;
  localidad: string;
  provincia: string;
  codPostal: string;
  cuenta?: string;
  correo: string;
  precioCierre: number;
};

// =====================
// FASE 1: NUEVOS TIPOS
// =====================

export type Contrato = {
  id: number;
  cliente_id: number;
  numero_contrato: string;
  operadora_origen?: string;
  operadora_destino: string;
  tipo_contrato: "PORTABILIDAD" | "NUEVA_LINEA" | "UPGRADE" | "RENOVACION";
  servicios: Array<{
    nombre: string;
    precio: number;
    descripcion?: string;
  }>;
  precio_total: number;
  fecha_inicio: Date;
  fecha_fin?: Date;
  fecha_renovacion?: Date;
  fecha_cancelacion?: Date;
  estado: 
    | "PENDIENTE_TRAMITACION"
    | "EN_TRAMITACION"
    | "ACTIVO"
    | "PROXIMO_VENCER"
    | "CANCELADO"
    | "CANCELADO_OPERADORA"
    | "RENOVADO";
  datos_portabilidad?: {
    numero_linea: string;
    cuenta_cliente: string;
    autorizado: boolean;
  };
  asesor_id?: number;
  asesor_nombre?: string;
  notas?: string;
  vigencia_meses?: number;
  comision_total?: number;
  created_at: Date;
  updated_at: Date;
};

export type OperadoraCambio = {
  id: number;
  operadora_nombre: string;
  nombre_promocion: string;
  descripcion?: string;
  tipo_promocion: "OFERTA_NUEVA" | "DESCUENTO" | "BONIFICACION" | "PORTABILIDAD" | "RENOVACION";
  precio_base: number;
  precio_oferta?: number;
  comision_asesor: number;
  comision_coordinador?: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  es_vigente: boolean;
  servicios: {
    fibra?: string;
    movil_gb?: string;
    tv?: string;
    streaming?: string[];
  };
  created_by?: number;
  updated_at: Date;
};

export type ComisionVenta = {
  id: number;
  contrato_id: number;
  cliente_id: number;
  operadora: string;
  tipo_venta: "PORTABILIDAD" | "NUEVA_LINEA" | "UPGRADE" | "RENOVACION" | "RECLAMACION";
  fecha_venta: Date;
  precio_venta: number;
  porcentaje_comision: number;
  monto_comision: number;
  asesor_id?: number;
  asesor_nombre: string;
  coordinador_id?: number;
  coordinador_nombre?: string;
  comision_asesor?: number;
  comision_coordinador?: number;
  estado_pago: "PENDIENTE" | "PAGADA" | "DEDUCIDA" | "CANCELADA";
  fecha_pago?: Date;
  numero_transferencia?: string;
  created_at: Date;
  updated_at: Date;
};

export type AuditoriaCambio = {
  id: number;
  tabla_modificada: string;
  registro_id: number;
  tipo_cambio: "INSERT" | "UPDATE" | "DELETE";
  valor_anterior?: Record<string, any>;
  valor_nuevo?: Record<string, any>;
  usuario_id?: number;
  usuario_nombre: string;
  usuario_email?: string;
  usuario_rol?: string;
  razon_cambio?: string;
  ip_address?: string;
  created_at: Date;
};

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: "ASESOR" | "COORDINADOR" | "ADMIN" | "GERENTE";
  operadora_asignada?: string;
  estado: "ACTIVO" | "INACTIVO" | "PERMISO";
  fecha_contratacion?: Date;
  comision_base?: number;
  created_at: Date;
  updated_at: Date;
};

export type HistorialServicioCliente = {
  id: number;
  cliente_id: number;
  servicio_anterior?: string;
  servicio_nuevo?: string;
  operadora_origen?: string;
  operadora_destino?: string;
  tipo_cambio: "PORTABILIDAD" | "UPGRADE" | "DOWNGRADE" | "CAMBIO_OPERADORA" | "AUMENTO_LINEAS";
  razon_cambio?: string;
  comision_generada?: number;
  asesor_nombre?: string;
  fecha_cambio: Date;
};
