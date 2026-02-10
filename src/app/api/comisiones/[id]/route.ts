import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";

export const PATCH = requireRole(
  ["ADMIN"],
  async (request: NextRequest, user, { params }: { params: { id: string } } = { params: { id: "" } }) => {
    try {
      const id = new URL(request.url).pathname.split("/").pop() || "";
      const comisionId = parseInt(id);
      const body = await request.json();
      const { estado_pago, fecha_pago, numero_transferencia } = body;

      const [oldRows]: any = await db.query(
        "SELECT * FROM comisiones_ventas WHERE id = ?",
        [comisionId]
      );
      if (oldRows.length === 0) {
        return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 });
      }

      let updateFields = [];
      let updateValues: any[] = [];

      if (estado_pago) {
        updateFields.push("estado_pago = ?");
        updateValues.push(estado_pago);
      }
      if (fecha_pago) {
        updateFields.push("fecha_pago = ?");
        updateValues.push(fecha_pago);
      }
      if (numero_transferencia) {
        updateFields.push("numero_transferencia = ?");
        updateValues.push(numero_transferencia);
      }

      updateValues.push(comisionId);
      const query = `UPDATE comisiones_ventas SET ${updateFields.join(", ")} WHERE id = ?`;
      await db.query(query, updateValues);

      await db.query(
        `INSERT INTO auditoria_cambios (
          tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo,
          usuario_nombre, razon_cambio
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "comisiones_ventas",
          comisionId,
          "UPDATE",
          JSON.stringify(oldRows[0]),
          JSON.stringify(body),
          user.nombre,
          "Estado de pago actualizado",
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Comisión actualizada exitosamente",
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
);

export const GET = requireRole(
  ["ADMIN"],
  async (request: NextRequest, user) => {
    try {
      const id = new URL(request.url).pathname.split("/").pop() || "";
      const comisionId = parseInt(id);
      const [rows]: any = await db.query(
        `SELECT 
          cv.*,
          cli.name as cliente_nombre,
          cli.dni as cliente_dni,
          c.numero_contrato
        FROM comisiones_ventas cv
        LEFT JOIN clientes cli ON cv.cliente_id = cli.id
        LEFT JOIN contratos c ON cv.contrato_id = c.id
        WHERE cv.id = ?`,
        [comisionId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 });
      }

      return NextResponse.json(rows[0]);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
);
