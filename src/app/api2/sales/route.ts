import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", 
  database: "crm", 
};

export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // 1. Obtener Ventas con TODOS los datos del cliente
    const [rows]: any = await connection.execute(`
      SELECT 
        s.id, 
        s.cliente_id as clienteId, 
        c.name as clientName, 
        c.dni as clienteDni,
        c.phone as clientPhone,
        c.email as clientEmail,
        c.address as clientAddress,
        c.city as clientCity,
        c.postalCode as clientPostalCode,
        s.operador_destino as operadorDestino, 
        s.precio_cierre as precioCierre, 
        s.status, 
        s.observaciones, 
        s.fecha as createdAt
      FROM sales s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      ORDER BY s.fecha DESC
    `);

    // 2. Obtener los items (con el JOIN a productos que hicimos antes)
    const [items]: any = await connection.execute(`
      SELECT 
        si.sale_id,
        si.nombre_servicio,
        si.precio_base,
        p.fiber,
        p.mobile_main_gb,
        p.mobile_main_speed,
        p.tv_package,
        p.streaming_services,
        p.extra_lines
      FROM sale_items si
      LEFT JOIN products p ON si.nombre_servicio = p.name
    `);

    const salesWithItems = rows.map((sale: any) => ({
      ...sale,
      // Agrupamos los datos del cliente para que el frontend los encuentre fácil
      clientFull: {
        phone: sale.clientPhone,
        email: sale.clientEmail,
        address: sale.clientAddress,
        city: sale.clientCity,
        postalCode: sale.clientPostalCode
      },
      servicios: items
        .filter((item: any) => item.sale_id === sale.id)
        .map((item: any) => ({ 
            nombre: item.nombre_servicio, 
            precioBase: item.precio_base,
            fiber: item.fiber,
            mobile_main_gb: item.mobile_main_gb,
            mobile_main_speed: item.mobile_main_speed,
            tv_package: item.tv_package,
            streaming_services: item.streaming_services,
            extra_lines: item.extra_lines
        }))
    }));

    return NextResponse.json(salesWithItems);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}