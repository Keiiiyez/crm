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
    
    const { client, sale } = body;

    const [clientResult] = await db.query(
      `INSERT INTO clientes 
        (name, dni, email, phone, address, city, province, postalCode, iban, operator, nationality, birthDate, gender, bankName) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        email = VALUES(email),
        phone = VALUES(phone),
        address = VALUES(address),
        city = VALUES(city),
        province = VALUES(province),
        postalCode = VALUES(postalCode),
        iban = VALUES(iban),
        operator = VALUES(operator),
        bankName = VALUES(bankName)`,
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
        client.operator,
        client.nationality || null,
        client.birthDate || null,
        client.gender || null,
        client.bankName || null
      ]
    );

    const [existingClient]: any = await db.query("SELECT id FROM clientes WHERE dni = ?", [client.dni]);
    const clienteId = existingClient[0].id;

    if (sale && (sale.total > 0 || sale.observations)) {
      await db.query(
        `INSERT INTO sales 
          (cliente_id, operador_destino, precio_cierre, status, observaciones, fecha) 
         VALUES (?, ?, ?, 'Pending', ?, NOW())`,
        [
          clienteId, 
          sale.operator_destino || client.operator, 
          sale.total || 0, 
          sale.observations || "Venta importada"
        ]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cliente y Venta procesados correctamente",
      clientId: clienteId 
    });

  } catch (error: any) {
    console.error("Error en API Clients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}