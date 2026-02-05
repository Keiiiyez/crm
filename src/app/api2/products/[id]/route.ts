import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",      
  password: "",     
  database: "crm", 
};

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; 
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute("DELETE FROM products WHERE id = ?", [id]);
    
    await connection.end();
    return NextResponse.json({ message: "Producto eliminado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}