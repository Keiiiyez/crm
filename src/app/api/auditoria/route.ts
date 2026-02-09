import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tablaModificada = searchParams.get("tabla");
    const usuarioId = searchParams.get("usuario_id");
    const tipoCambio = searchParams.get("tipo_cambio");
    const registroId = searchParams.get("registro_id");
    const dias = searchParams.get("dias") || "30"; // Por defecto, últimos 30 días

    let query = `
      SELECT *
      FROM auditoria_cambios
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    let params: any[] = [parseInt(dias)];

    if (tablaModificada) {
      query += " AND tabla_modificada = ?";
      params.push(tablaModificada);
    }
    if (usuarioId) {
      query += " AND usuario_id = ?";
      params.push(parseInt(usuarioId));
    }
    if (tipoCambio) {
      query += " AND tipo_cambio = ?";
      params.push(tipoCambio);
    }
    if (registroId) {
      query += " AND registro_id = ?";
      params.push(parseInt(registroId));
    }

    query += " ORDER BY created_at DESC LIMIT 500";

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tabla_modificada,
      registro_id,
      tipo_cambio,
      valor_anterior,
      valor_nuevo,
      usuario_id,
      usuario_nombre,
      usuario_email,
      usuario_rol,
      razon_cambio,
      ip_address,
    } = body;

    if (!tabla_modificada || !registro_id || !tipo_cambio) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo,
        usuario_id, usuario_nombre, usuario_email, usuario_rol, razon_cambio, ip_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tabla_modificada,
        registro_id,
        tipo_cambio,
        valor_anterior ? JSON.stringify(valor_anterior) : null,
        valor_nuevo ? JSON.stringify(valor_nuevo) : null,
        usuario_id || null,
        usuario_nombre || "Sistema",
        usuario_email || null,
        usuario_rol || null,
        razon_cambio || null,
        ip_address || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Cambio registrado en auditoría",
    });
  } catch (error: any) {
    console.error("Error en POST auditoría:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
