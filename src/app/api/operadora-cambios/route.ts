import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET operadoras con promociones vigentes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const operadora = searchParams.get("operadora");
    const vigentes = searchParams.get("vigentes") === "true";

    let query = `
      SELECT *
      FROM operadora_cambios
      WHERE 1=1
    `;
    let params: any[] = [];

    if (operadora) {
      query += " AND operadora_nombre = ?";
      params.push(operadora);
    }

    if (vigentes) {
      query += " AND es_vigente = true AND fecha_fin >= CURDATE()";
    }

    query += " ORDER BY fecha_inicio DESC";

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Crear nueva promoción de operadora
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      operadora_nombre,
      nombre_promocion,
      descripcion,
      tipo_promocion,
      precio_base,
      precio_oferta,
      comision_asesor,
      comision_coordinador,
      fecha_inicio,
      fecha_fin,
      servicios,
      created_by,
    } = body;

    if (!operadora_nombre || !nombre_promocion || !fecha_inicio || !fecha_fin) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const [result]: any = await db.query(
      `INSERT INTO operadora_cambios (
        operadora_nombre, nombre_promocion, descripcion, tipo_promocion,
        precio_base, precio_oferta, comision_asesor, comision_coordinador,
        fecha_inicio, fecha_fin, servicios, created_by, es_vigente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        operadora_nombre,
        nombre_promocion,
        descripcion || null,
        tipo_promocion || "OFERTA_NUEVA",
        precio_base,
        precio_oferta || precio_base,
        comision_asesor,
        comision_coordinador || 0,
        fecha_inicio,
        fecha_fin,
        JSON.stringify(servicios || {}),
        created_by || null,
        true, // Por defecto es vigente
      ]
    );

    // Registrar en auditoría
    await db.query(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, valor_nuevo,
        usuario_nombre, razon_cambio
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "operadora_cambios",
        result.insertId,
        "INSERT",
        JSON.stringify(body),
        "Sistema",
        `Nueva promoción creada: ${nombre_promocion}`,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Promoción registrada exitosamente",
      promotionId: result.insertId,
    });
  } catch (error: any) {
    console.error("Error en POST operadora_cambios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
