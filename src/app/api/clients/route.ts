// src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM clientes ORDER BY id DESC");
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, dni, email, phone, address, city, province, postalCode, IBAN, operator } = body;

    const [result] = await db.query(
      "INSERT INTO clientes (name, dni, email, phone, address, city, province, postalCode, iban, operator) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, dni, email, phone, address, city, province, postalCode, IBAN, operator || null]
    );

    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}