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
    const { status } = await req.json();

    connection = await mysql.createConnection(dbConfig);

    const [result]: any = await connection.execute(
      "UPDATE sales SET status = ? WHERE id = ?",
      [status, id]
    );

    return NextResponse.json({ message: "Estado actualizado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}