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
  avatarUrl?: string;
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
  status: "Completed" | "Pending" | "Cancelled";
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
