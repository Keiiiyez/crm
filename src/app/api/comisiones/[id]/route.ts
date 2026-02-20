import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export const PATCH = requireRole(
  ["ADMIN"],
  async (request: NextRequest, user) => {
    try {
      const id = new URL(request.url).pathname.split("/").pop() || "";
      const comisionId = parseInt(id);
      const formData = await request.formData();
      const estado_pago = formData.get("estado_pago") as string;
      const fecha_pago = formData.get("fecha_pago") as string;
      const numero_transferencia = formData.get("numero_transferencia") as string;
      const file = formData.get("comprobante") as File | null;

      const [oldRows]: any = await db.query(
        "SELECT * FROM comisiones_ventas WHERE id = ?",
        [comisionId]
      );
      if (oldRows.length === 0) {
        return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 });
      }

      let updateFields = [];
      let updateValues: any[] = [];
      let comprobanteUrl = oldRows[0].comprobante_url;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = join(process.cwd(), "public/uploads/comprobantes");
        await mkdir(uploadDir, { recursive: true });

        const fileName = `${comisionId}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const filePath = join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        comprobanteUrl = `/uploads/comprobantes/${fileName}`; // Ruta pública
      }

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
      
      updateFields.push("comprobante_url = ?");
      updateValues.push(comprobanteUrl);

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
          JSON.stringify({ estado_pago, numero_transferencia, comprobanteUrl }),
          user.nombre,
          "Pago y comprobante actualizados",
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Comisión y comprobante actualizados exitosamente",
      });
    } catch (error: any) {
      console.error("Error en PATCH comisiones:", error);
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
        `SELECT cv.*, cli.name as cliente_nombre, cli.dni as cliente_dni, c.numero_contrato
        FROM comisiones_ventas cv
        LEFT JOIN clientes cli ON cv.cliente_id = cli.id
        LEFT JOIN contratos c ON cv.contrato_id = c.id
        WHERE cv.id = ?`,
        [comisionId]
      );

      if (rows.length === 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      return NextResponse.json(rows[0]);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
);