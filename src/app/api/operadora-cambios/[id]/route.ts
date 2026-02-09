import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cambioId = parseInt(params.id);
    const body = await request.json();
    const { es_vigente, precio_oferta, comision_asesor, servicios } = body;

    // Obtener cambio anterior para auditoría
    const [oldRows]: any = await db.query(
      "SELECT * FROM operadora_cambios WHERE id = ?",
      [cambioId]
    );
    if (oldRows.length === 0) {
      return NextResponse.json(
        { error: "Promoción no encontrada" },
        { status: 404 }
      );
    }

    let updateFields = [];
    let updateValues: any[] = [];

    if (es_vigente !== undefined) {
      updateFields.push("es_vigente = ?");
      updateValues.push(es_vigente);
    }
    if (precio_oferta !== undefined) {
      updateFields.push("precio_oferta = ?");
      updateValues.push(precio_oferta);
    }
    if (comision_asesor !== undefined) {
      updateFields.push("comision_asesor = ?");
      updateValues.push(comision_asesor);
    }
    if (servicios !== undefined) {
      updateFields.push("servicios = ?");
      updateValues.push(JSON.stringify(servicios));
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    updateValues.push(cambioId);
    const query = `UPDATE operadora_cambios SET ${updateFields.join(", ")} WHERE id = ?`;
    await db.query(query, updateValues);

    // Registrar en auditoría
    await db.query(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo,
        usuario_nombre, razon_cambio
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "operadora_cambios",
        cambioId,
        "UPDATE",
        JSON.stringify(oldRows[0]),
        JSON.stringify(body),
        "Sistema",
        "Promoción actualizada",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Promoción actualizada exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
