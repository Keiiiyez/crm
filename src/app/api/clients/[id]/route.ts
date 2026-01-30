import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    
    const { id } = await params; 
    
    await db.query("DELETE FROM clientes WHERE id = ?", [id]);
    return NextResponse.json({ message: "Borrado OK" });
  } catch (error: any) {
    console.error("Error al borrar:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; 
    const body = await request.json();
    const { name, dni, email, phone, address, city, province, postalCode, IBAN, operator } = body;

    await db.query(
      "UPDATE clientes SET name=?, dni=?, email=?, phone=?, address=?, city=?, province=?, postalCode=?, iban=?, operator=? WHERE id=?",
      [name, dni, email, phone, address, city, province, postalCode, IBAN, operator || null, id]
    );

    return NextResponse.json({ message: "Actualizado OK" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}