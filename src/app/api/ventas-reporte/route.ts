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
    const [rows]: any = await connection.execute(`
      SELECT 
        s.id, 
        c.name as clientName, 
        c.dni as clienteDni,
        s.operador_destino as operadorDestino, 
        s.precio_cierre as precioCierre, 
        s.usuario_nombre as usuarioNombre,
        s.fecha as createdAt,
        u_coord.nombre as coordinadorNombre
      FROM sales s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN usuarios u_asesor ON s.usuario_nombre = u_asesor.nombre
      LEFT JOIN usuarios u_coord ON u_asesor.coordinador_id = u_coord.id
      ORDER BY s.fecha DESC
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}