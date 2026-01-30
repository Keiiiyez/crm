import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Configuración de tu XAMPP
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // Por defecto en XAMPP está vacío
  database: "crm", // CAMBIA ESTO por el nombre real de tu DB
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clienteId, operadorDestino, servicios, precioCierre } = body;

    const connection = await mysql.createConnection(dbConfig);

    // 1. Insertar la venta general
    const [saleResult]: any = await connection.execute(
      "INSERT INTO sales (cliente_id, operador_destino, precio_cierre) VALUES (?, ?, ?)",
      [clienteId, operadorDestino, precioCierre]
    );

    const saleId = saleResult.insertId;

    // 2. Insertar cada servicio de esa venta
    for (const servicio of servicios) {
      await connection.execute(
        "INSERT INTO sale_items (sale_id, nombre_servicio, precio_base) VALUES (?, ?, ?)",
        [saleId, servicio.nombre, servicio.precioBase]
      );
    }

    await connection.end();

    return NextResponse.json({ message: "Venta guardada", id: saleId }, { status: 201 });
  } catch (error) {
    console.error("Error en la venta:", error);
    return NextResponse.json({ error: "No se pudo guardar la venta" }, { status: 500 });
  }
}