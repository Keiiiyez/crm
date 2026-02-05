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
    // Traemos todos los campos para que la tabla no tenga undefined
    const [rows] = await connection.execute("SELECT * FROM products ORDER BY id DESC");
    await connection.end();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer productos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, price, category, operator, type, 
      fiber, landline, mobile_main_gb, mobile_main_speed 
    } = body;

    const connection = await mysql.createConnection(dbConfig);
    
    // IMPORTANTE: Asegúrate de que tu tabla 'products' tenga estas columnas
    const query = `
      INSERT INTO products 
      (name, price, category, operator, type, fiber, landline, mobile_main_gb, mobile_main_speed) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      name, 
      price, 
      category, 
      operator, 
      type, 
      fiber || null, 
      landline ? 1 : 0, 
      mobile_main_gb || null, 
      mobile_main_speed || null
    ]);

    await connection.end();
    return NextResponse.json({ message: "Producto guardado" });
  } catch (error: any) {
    console.error("Error en POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}