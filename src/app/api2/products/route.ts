import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";
import { requirePermission } from "@/lib/api-auth";

const dbConfig = {
  host: "localhost",
  user: "root",      
  password: "",     
  database: "crm", 
};

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    // Obtenemos todos los registros ordenados por el más reciente
    const [rows] = await connection.execute("SELECT * FROM products ORDER BY id DESC");
    await connection.end();
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer productos" }, { status: 500 });
  }
}

export const POST = requirePermission("create_product", async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { 
      name, 
      price, 
      category, 
      operator, 
      type, 
      fiber, 
      landline, 
      mobile_main_gb, 
      mobile_main_speed,
      extra_lines,        // Array de líneas adicionales
      tv_package,         // Nombre del pack de TV
      streaming_services  // Array de servicios (Netflix, HBO, etc.)
    } = body;

    const connection = await mysql.createConnection(dbConfig);
    
    // Consulta extendida con los nuevos campos de TV y Streaming
    const query = `
      INSERT INTO products 
      (name, price, category, operator, type, fiber, landline, 
       mobile_main_gb, mobile_main_speed, extra_lines, tv_package, streaming_services) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      mobile_main_speed || null,
      JSON.stringify(extra_lines || []),       // Guardar array como JSON string
      tv_package || "SIN TV",
      JSON.stringify(streaming_services || []) // Guardar array como JSON string
    ]);

    await connection.end();
    return NextResponse.json({ message: "Producto guardado correctamente" });
  } catch (error: any) {
    console.error("Error en POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});