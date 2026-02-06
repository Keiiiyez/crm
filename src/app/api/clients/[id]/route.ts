import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const { id } = await params; 
    await db.query("DELETE FROM clientes WHERE id = ?", [id]);
    return NextResponse.json({ message: "Borrado" });
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
    
    const { client } = body; 

    await db.query(
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
  }
}