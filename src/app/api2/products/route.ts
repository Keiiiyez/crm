import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",      
  password: "",     
  database: "crm", 
};
export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM products ORDER BY name ASC");
    await connection.end();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer productos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, price } = await req.json();
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO products (name, price) VALUES (?, ?)",
      [name, price]
    );
    await connection.end();
    return NextResponse.json({ message: "Producto guardado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}