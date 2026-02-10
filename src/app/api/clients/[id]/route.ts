import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "crm",
};

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  let connection;
  try {
    const clientId = params.id;

    if (!clientId) {
      return NextResponse.json(
        { error: "Cliente ID es requerido" },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    const result = await connection.execute(
      `SELECT * FROM clientes WHERE id = ?`,
      [clientId]
    );
    
    const rows = result[0] as any[];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener cliente" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  let connection;
  try {
    const { id } = await params;
    connection = await mysql.createConnection(dbConfig);
    await connection.execute("DELETE FROM clientes WHERE id = ?", [id]);
    return NextResponse.json({ message: "Borrado" });
  } catch (error: any) {
    console.error("Error al borrar:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    const { id } = await params; 
    const body = await request.json();
    
    const { client } = body;
    connection = await mysql.createConnection(dbConfig);

    await connection.execute(
      `UPDATE clientes SET 
        name=?, 
        dni=?, 
        email=?, 
        phone=?, 
        address=?, 
        city=?, 
        province=?, 
        postalCode=?, 
        iban=?, 
        operator=?,
        nationality=?,
        birthDate=?,
        gender=?,
        bankName=?
      WHERE id=?`,
      [
        client.name, 
        client.dni, 
        client.email, 
        client.phone, 
        client.address, 
        client.city, 
        client.province, 
        client.postalCode, 
        client.iban,
        client.operator || null,
        client.nationality || null,
        client.birthDate || null,
        client.gender || null,
        client.bankName || null,
        id
      ]
    );

    return NextResponse.json({ message: "Actualizado" });
  } catch (error: any) {
    console.error("Error al actualizar:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}