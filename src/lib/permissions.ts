// Sistema simple de roles y permisos para el CRM

export type UserRole = "ASESOR" | "COORDINADOR" | "ADMIN" | "GERENTE";

export type Permission = 
  | "view_dashboard"
  | "view_sales"
  | "create_sale"
  | "edit_sale"
  | "delete_sale"
  | "view_clients"
  | "create_client"
  | "edit_client"
  | "view_contracts"
  | "create_contract"
  | "edit_contract"
  | "delete_contract"
  | "view_commissions"
  | "edit_commission_payment"
  | "view_operators"
  | "create_operator_promo"
  | "edit_operator_promo"
  | "view_audit"
  | "view_reports"
  | "create_users"
  | "edit_users"
  | "create_product"
  | "edit_product";

// Mapeo de permisos por rol
export const rolePermissions: Record<UserRole, Permission[]> = {
  ASESOR: [
    // Básico: solo vender y ver sus datos
    "view_dashboard",
    "view_sales",
    "create_sale",
    "view_clients",
    "view_contracts", // Puede ver contratos que genera
  ],

  COORDINADOR: [
    // Coordinador: supervisa asesores y gestiona ventas (sin crear servicios/productos)
    "view_dashboard",
    "view_sales",
    "create_sale",
    "edit_sale",
    "view_clients",
    "create_client",
    "edit_client",
    "view_contracts",
    "edit_commission_payment", // Marcar comisiones como pagadas
    "view_operators",
    "view_audit", // Puede ver auditoría
    "view_reports",
  ],

  GERENTE: [
    // Gerente: acceso casi total menos crear usuarios
    "view_dashboard",
    "view_sales",
    "create_sale",
    "edit_sale",
    "delete_sale",
    "view_clients",
    "create_client",
    "edit_client",
    "view_contracts",
    "create_contract",
    "edit_contract",
    "delete_contract",
    "edit_commission_payment",
    "view_operators",
    "create_operator_promo",
    "edit_operator_promo",
    "view_audit",
    "view_reports",
    "create_product",
    "edit_product",
  ],

  ADMIN: [
    // Admin: acceso TOTAL a todo
    "view_dashboard",
    "view_sales",
    "create_sale",
    "edit_sale",
    "delete_sale",
    "view_clients",
    "create_client",
    "edit_client",
    "view_contracts",
    "create_contract",
    "edit_contract",
    "delete_contract",
    "view_commissions", // Solo admin puede ver comisiones
    "edit_commission_payment",
    "view_operators",
    "create_operator_promo",
    "edit_operator_promo",
    "view_audit",
    "view_reports",
    "create_users",
    "edit_users",
    "create_product",
    "edit_product",
  ],
};

// Función para verificar si un usuario tiene permiso
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

// Función para obtener permisos de un rol
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role];
}

// Descripción de roles para UI
export const roleDescriptions: Record<UserRole, { name: string; description: string }> = {
  ASESOR: {
    name: "Asesor",
    description: "Registra ventas. Acceso básico.",
  },
  COORDINADOR: {
    name: "Coordinador",
    description: "Supervisa asesores y gestiona ventas. Acceso intermedio.",
  },

  GERENTE: {
    name: "Gerente",
    description: "Acceso casi total excepto gestión de usuarios. Control total de operaciones.",
  },
  ADMIN: {
    name: "Administrador",
    description: "Acceso total al sistema. Puede crear y editar usuarios.",
  },
};
