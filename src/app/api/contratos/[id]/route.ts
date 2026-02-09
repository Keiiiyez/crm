import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const contractId = parseInt(params.id);
    const [rows]: any = await db.query(
      `SELECT 
        c.*,
        cli.name as cliente_nombre,
        cli.dni as cliente_dni,
        cli.phone as cliente_phone,
        cli.email as cliente_email,
        cli.province as cliente_provincia
      FROM contratos c
      LEFT JOIN clientes cli ON c.cliente_id = cli.id
      WHERE c.id = ?`,
      [contractId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const contractId = parseInt(params.id);
    const body = await request.json();
    const { estado, datos_portabilidad, asesor_nombre, razon_cambio, comision_total } = body;

    // Obtener contrato anterior para auditoría
    const [oldRows]: any = await db.query("SELECT * FROM contratos WHERE id = ?", [contractId]);
    if (oldRows.length === 0) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }
    const oldContract = oldRows[0];

    // Actualizar contrato
    let updateFields = [];
    let updateValues: any[] = [];

    if (estado !== undefined) {
      updateFields.push("estado = ?");
      updateValues.push(estado);
    }
    if (datos_portabilidad !== undefined) {
      updateFields.push("datos_portabilidad = ?");
      updateValues.push(JSON.stringify(datos_portabilidad));
    }
    if (comision_total !== undefined) {
      updateFields.push("comision_total = ?");
      updateValues.push(comision_total);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    updateValues.push(contractId);
    const query = `UPDATE contratos SET ${updateFields.join(", ")} WHERE id = ?`;
    await db.query(query, updateValues);

    // Registrar en auditoría
    await db.query(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo,
        usuario_nombre, razon_cambio
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "contratos",
        contractId,
        "UPDATE",
        JSON.stringify(oldContract),
        JSON.stringify(body),
        asesor_nombre || "Sistema",
        razon_cambio || "Contrato actualizado",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Contrato actualizado exitosamente",
    });
  } catch (error: any) {
    console.error("Error en PATCH contratos:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const contractId = parseInt(params.id);

    // Obtener contrato para auditoría
    const [rows]: any = await db.query("SELECT * FROM contratos WHERE id = ?", [contractId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
    }

    // Soft delete: cambiar estado a CANCELADO en lugar de borrar
    await db.query("UPDATE contratos SET estado = 'CANCELADO' WHERE id = ?", [contractId]);

    // Registrar en auditoría
    await db.query(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, valor_anterior,
        usuario_nombre, razon_cambio
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "contratos",
        contractId,
        "DELETE",
        JSON.stringify(rows[0]),
        "Sistema",
        "Contrato cancelado",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Contrato cancelado exitosamente",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
