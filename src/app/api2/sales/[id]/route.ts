import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", 
  database: "crm", 
};

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  let connection;
  try {
    const { id } = await params; 
    connection = await mysql.createConnection(dbConfig);

    const [result]: any = await connection.execute("DELETE FROM sales WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Venta eliminada correctamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Extraemos los posibles campos que pueden venir del cliente
    const { status, gestion_notas, gestion_checklist } = body;

    connection = await mysql.createConnection(dbConfig);

    // Construimos la consulta dinámicamente según lo que venga en el body
    const updates = [];
    const values = [];

    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (gestion_notas !== undefined) { updates.push("gestion_notas = ?"); values.push(gestion_notas); }
    if (gestion_checklist !== undefined) { 
      updates.push("gestion_checklist = ?"); 
      values.push(JSON.stringify(gestion_checklist)); 
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE sales SET ${updates.join(", ")} WHERE id = ?`;

    await connection.execute(query, values);

    return NextResponse.json({ message: "Venta actualizada correctamente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}