import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", 
  database: "crm", 
};

// GET: Obtener todas las ventas con sus items y datos de cliente
export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows]: any = await connection.execute(`
      SELECT 
        s.id, 
        s.cliente_id as clienteId, 
        c.name as clientName, 
        s.operador_destino as operadorDestino, 
        s.precio_cierre as precioCierre, 
        s.status,
        s.observaciones,
        s.fecha as createdAt
      FROM sales s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      ORDER BY s.fecha DESC
    `);

    const [items]: any = await connection.execute("SELECT * FROM sale_items");

    const salesWithItems = rows.map((sale: any) => ({
      ...sale,
      servicios: items
        .filter((item: any) => item.sale_id === sale.id)
        .map((item: any) => ({ 
            nombre: item.nombre_servicio, 
            precioBase: item.precio_base 
        }))
    }));

    return NextResponse.json(salesWithItems);
  } catch (error: any) {
    console.error("ERROR SQL GET:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// POST: Guardar nueva venta y sus servicios
export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const { clienteId, operadorDestino, servicios, precioCierre, observaciones } = body;
    const status = body.status || "Pending";

    connection = await mysql.createConnection(dbConfig);
    
    // Iniciar transacción para asegurar que se guarde todo o nada
    await connection.beginTransaction();

    const [saleResult]: any = await connection.execute(
      "INSERT INTO sales (cliente_id, operador_destino, precio_cierre, status, observaciones) VALUES (?, ?, ?, ?, ?)",
      [clienteId, operadorDestino, precioCierre, status, observaciones]
    );

    const saleId = saleResult.insertId;

    for (const servicio of servicios) {
      await connection.execute(
        "INSERT INTO sale_items (sale_id, nombre_servicio, precio_base) VALUES (?, ?, ?)",
        [saleId, servicio.nombre, servicio.precioBase]
      );
    }

    await connection.commit();
    return NextResponse.json({ message: "Venta guardada", id: saleId }, { status: 201 });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Error en POST:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}