import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Maneja la carga de productos (GET)
export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM products ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Maneja la creación de productos (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, price } = body;

    // Validamos que lleguen los datos
    if (!name || !price) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const [result] = await db.query(
      "INSERT INTO products (name, price) VALUES (?, ?)",
      [name, price]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error: any) {
    console.error("Error en DB:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}