import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";
import { requirePermission } from "@/lib/api-auth";

const dbConfig = {
  host: "localhost",
  user: "root",      
  password: "",     
  database: "crm", 
};

export const DELETE = requirePermission("edit_product", async (
  request: NextRequest,
  user
) => {
  try {
    const id = new URL(request.url).pathname.split("/").pop() || "";
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute("DELETE FROM products WHERE id = ?", [id]);
    
    await connection.end();
    return NextResponse.json({ message: "Producto eliminado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});