import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";
import { requirePermission } from "@/lib/api-auth";

const dbConfig = {
  host: "localhost",
  user: "root",      
  password: "",     
  database: "crm", 
};

export async function GET(req: NextRequest) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const operator = req.nextUrl.searchParams.get('operator');
    let rows: any = [];
    if (operator) {
      const [r] = await connection.execute("SELECT * FROM products WHERE operator = ? ORDER BY id DESC", [operator]);
      rows = r;
    } else {
      const [r] = await connection.execute("SELECT * FROM products ORDER BY id DESC");
      rows = r;
    }
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
      price_full,       
      promo_note,       
      category, 
      operator, 
      type, 
      fiber, 
      landline, 
      mobile_main_gb, 
      mobile_main_speed,
      extra_lines,        
      tv_package,         
      streaming_services  
    } = body;

    const connection = await mysql.createConnection(dbConfig);
    
    // Consulta actualizada con price_full y promo_note
    const query = `
      INSERT INTO products 
      (name, price, price_full, promo_note, category, operator, type, fiber, landline, 
       mobile_main_gb, mobile_main_speed, extra_lines, tv_package, streaming_services) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      name, 
      price, 
      price_full || null,      // <--- NUEVO
      promo_note || null,      // <--- NUEVO
      category, 
      operator, 
      type, 
      fiber || null, 
      landline ? 1 : 0, 
      mobile_main_gb || null, 
      mobile_main_speed || null,
      JSON.stringify(extra_lines || []),       
      tv_package || "SIN TV",
      JSON.stringify(streaming_services || []) 
    ]);

    await connection.end();
    return NextResponse.json({ message: "Producto guardado correctamente" });
  } catch (error: any) {
    console.error("Error en POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});