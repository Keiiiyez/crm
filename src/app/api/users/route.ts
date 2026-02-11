import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", 
  database: "crm", 
};

// TRAER TODOS LOS USUARIOS
export async function GET() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows]: any = await connection.execute(`
      SELECT id, name, email, role, coordinador_id 
      FROM usuarios 
      ORDER BY role ASC, name ASC
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

// ACTUALIZAR ROL O COORDINADOR
export async function PATCH(request: NextRequest) {
  let connection;
  try {
    const { userId, field, value } = await request.json();

    // Seguridad básica: evitar campos no permitidos
    const allowedFields = ["role", "coordinador_id"];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Campo no permitido" }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);
    
    // Si el valor es "null" o vacío para coordinador_id, enviamos NULL a SQL
    const finalValue = value === "" || value === "null" ? null : value;

    await connection.execute(
      `UPDATE usuarios SET ${field} = ? WHERE id = ?`,
      [finalValue, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}