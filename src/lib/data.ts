import type { Client, Product, Operator, Sale } from './definitions';

export const clients: Client[] = [
  { id: '1', name: 'Carlos Rodriguez', dni: '12345678A', phone: '600112233', email: 'carlos.r@example.com', address: 'Calle Falsa 123', city: 'Madrid', province: 'Madrid', postalCode: '28001', registrationDate: '2023-01-15', avatarUrl: 'https://picsum.photos/seed/1/100/100' },
  { id: '2', name: 'Ana Lopez', dni: '87654321B', phone: '611223344', email: 'ana.l@example.com', address: 'Avenida Siempre Viva 742', city: 'Barcelona', province: 'Barcelona', postalCode: '08001', registrationDate: '2023-02-20', avatarUrl: 'https://picsum.photos/seed/2/100/100' },
  { id: '3', name: 'Pedro Gomez', dni: '11223344C', phone: '622334455', email: 'pedro.g@example.com', address: 'Plaza Mayor 1', city: 'Sevilla', province: 'Sevilla', postalCode: '41001', registrationDate: '2023-03-10', avatarUrl: 'https://picsum.photos/seed/3/100/100' },
  { id: '4', name: 'Laura Fernandez', dni: '44332211D', phone: '633445566', email: 'laura.f@example.com', address: 'Gran Vía 22', city: 'Valencia', province: 'Valencia', postalCode: '46001', registrationDate: '2023-04-05', avatarUrl: 'https://picsum.photos/seed/4/100/100' },
  { id: '5', name: 'Javier Martinez', dni: '55667788E', phone: '644556677', email: 'javier.m@example.com', address: 'Paseo de la Castellana 100', city: 'Madrid', province: 'Madrid', postalCode: '28046', registrationDate: '2023-05-25', avatarUrl: 'https://picsum.photos/seed/5/100/100' },
];

export const products: Product[] = [
  { id: '1', name: 'Plan Fibra 500', description: 'Conexión de fibra óptica de 500 Mbps', price: 29.99, category: 'Fibra', inStock: true },
  { id: '2', name: 'Plan Móvil Plus', description: 'Llamadas ilimitadas y 50GB de datos', price: 19.99, category: 'Móvil', inStock: true },
  { id: '3', name: 'Pack TV Total', description: 'Todos los canales de cine y series', price: 15.00, category: 'Televisión', inStock: false },
  { id: '4', name: 'Seguridad Hogar', description: 'Sistema de alarma y cámaras', price: 39.99, category: 'Seguridad', inStock: true },
];

export const operators: Operator[] = [
  { id: '1', name: 'Elena Garcia', role: 'Sales Agent', email: 'elena.g@ventalink.com', phone: '910123456', hireDate: '2022-08-01', avatarUrl: 'https://picsum.photos/seed/6/100/100' },
  { id: '2', name: 'Marcos Alonso', role: 'Sales Manager', email: 'marcos.a@ventalink.com', phone: '910654321', hireDate: '2021-05-15', avatarUrl: 'https://picsum.photos/seed/7/100/100' },
  { id: '3', name: 'Sofia Reyes', role: 'Sales Agent', email: 'sofia.r@ventalink.com', phone: '910789012', hireDate: '2023-01-20', avatarUrl: 'https://picsum.photos/seed/8/100/100' },
];

export const sales: Sale[] = [
  { id: '1', clientName: 'Carlos Rodriguez', productName: 'Plan Fibra 500', operatorName: 'Elena Garcia', saleDate: '2024-05-10', amount: 29.99, status: 'Completed' },
  { id: '2', clientName: 'Ana Lopez', productName: 'Plan Móvil Plus', operatorName: 'Sofia Reyes', saleDate: '2024-05-12', amount: 19.99, status: 'Completed' },
  { id: '3', clientName: 'Pedro Gomez', productName: 'Pack TV Total', operatorName: 'Elena Garcia', saleDate: '2024-05-13', amount: 15.00, status: 'Pending' },
  { id: '4', clientName: 'Laura Fernandez', productName: 'Seguridad Hogar', operatorName: 'Sofia Reyes', saleDate: '2024-05-15', amount: 39.99, status: 'Completed' },
  { id: '5', clientName: 'Javier Martinez', productName: 'Plan Fibra 500', operatorName: 'Elena Garcia', saleDate: '2024-05-20', amount: 29.99, status: 'Cancelled' },
];

export const salesByMonth = [
    { month: "Jan", sales: 120 },
    { month: "Feb", sales: 150 },
    { month: "Mar", sales: 170 },
    { month: "Apr", sales: 210 },
    { month: "May", sales: 250 },
    { month: "Jun", sales: 230 },
    { month: "Jul", sales: 280 },
    { month: "Aug", sales: 300 },
    { month: "Sep", sales: 280 },
    { month: "Oct", sales: 310 },
    { month: "Nov", sales: 340 },
    { month: "Dec", sales: 380 },
]

export const OPERATOR_OPTIONS = ["Movistar", "Orange", "Vodafone", "MásMóvil", "Yoigo", "O2", "Pepephone"];
