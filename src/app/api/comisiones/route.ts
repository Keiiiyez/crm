import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const asesorId = searchParams.get("asesor_id");
    const estadoPago = searchParams.get("estado_pago");
    const operadora = searchParams.get("operadora");

    let query = `
      SELECT 
        cv.*,
        cli.name as cliente_nombre,
        cli.dni as cliente_dni,
        c.numero_contrato,
        c.operadora_destino
      FROM comisiones_ventas cv
      LEFT JOIN clientes cli ON cv.cliente_id = cli.id
      LEFT JOIN contratos c ON cv.contrato_id = c.id
      WHERE 1=1
    `;
    let params: any[] = [];

    if (asesorId) {
      query += " AND cv.asesor_id = ?";
      params.push(parseInt(asesorId));
    }
    if (estadoPago) {
      query += " AND cv.estado_pago = ?";
      params.push(estadoPago);
    }
    if (operadora) {
      query += " AND cv.operadora = ?";
      params.push(operadora);
    }

    query += " ORDER BY cv.fecha_venta DESC";

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
      contrato_id,
      cliente_id,
      operadora,
      tipo_venta,
      fecha_venta,
      precio_venta,
      porcentaje_comision,
      asesor_id,
      asesor_nombre,
      coordinador_id,
      coordinador_nombre,
    } = body;

    if (!cliente_id || !operadora || !tipo_venta) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const monto_comision = precio_venta * (porcentaje_comision / 100);
    const comision_asesor = monto_comision * 0.8; // 80% al asesor
    const comision_coordinador = monto_comision * 0.2; // 20% al coordinador

    const [result]: any = await db.query(
      `INSERT INTO comisiones_ventas (
        contrato_id, cliente_id, operadora, tipo_venta, fecha_venta,
        precio_venta, porcentaje_comision, monto_comision,
        asesor_id, asesor_nombre, coordinador_id, coordinador_nombre,
        comision_asesor, comision_coordinador, estado_pago
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contrato_id || null,
        cliente_id,
        operadora,
        tipo_venta,
        fecha_venta,
        precio_venta,
        porcentaje_comision,
        monto_comision,
        asesor_id || null,
        asesor_nombre,
        coordinador_id || null,
        coordinador_nombre || null,
        comision_asesor,
        comision_coordinador,
        "PENDIENTE",
      ]
    );

    // Actualizar comision_total en el contrato si existe
    if (contrato_id) {
      await db.query(
        "UPDATE contratos SET comision_total = comision_total + ? WHERE id = ?",
        [monto_comision, contrato_id]
      );
    }

    // Registrar en auditoría
    await db.query(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, valor_nuevo,
        usuario_nombre, razon_cambio
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "comisiones_ventas",
        result.insertId,
        "INSERT",
        JSON.stringify(body),
        asesor_nombre,
        "Comisión de venta registrada",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Comisión registrada exitosamente",
      comisionId: result.insertId,
      detalles: {
        monto_comision,
        comision_asesor,
        comision_coordinador,
      },
    });
  } catch (error: any) {
    console.error("Error en POST comisiones:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
