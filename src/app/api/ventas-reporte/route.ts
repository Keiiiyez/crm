import { NextResponse, NextRequest } from "next/server";
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
    // Query simplificada para asegurar que traiga ALGO
    const [rows]: any = await connection.execute(`
      SELECT 
        s.id, 
        c.name as clientName, 
        c.dni as clienteDni,
        s.operador_destino as operadorDestino, 
        s.precio_cierre as precioCierre, 
        s.usuario_nombre as usuarioNombre,
        s.fecha as createdAt
      FROM sales s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      ORDER BY s.fecha DESC
    `);

    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}