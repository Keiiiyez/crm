// EJEMPLO: API protegida por permiso
// Solo coordinadores y admins pueden marcar comisiones como pagadas

import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from "@/lib/api-auth"
import { db } from "@/lib/db"

export const PATCH = requirePermission(
  "edit_commission_payment",
  async (req: NextRequest, user) => {
    try {
      const body = await req.json()
      const comisionId = parseInt(req.nextUrl.searchParams.get("id") || "0")

      if (!comisionId) {
        return NextResponse.json(
          { error: "ID de comisión requerido" },
          { status: 400 }
        )
      }

      const { estado_pago, fecha_pago, numero_transferencia } = body

      // Obtener comisión anterior para auditoría
      const [oldRows]: any = await db.query(
        "SELECT * FROM comisiones_ventas WHERE id = ?",
        [comisionId]
      )

      if (oldRows.length === 0) {
        return NextResponse.json(
          { error: "Comisión no encontrada" },
          { status: 404 }
        )
      }

      // Actualizar
      await db.query(
        `UPDATE comisiones_ventas 
         SET estado_pago = ?, fecha_pago = ?, numero_transferencia = ? 
         WHERE id = ?`,
        [estado_pago, fecha_pago, numero_transferencia, comisionId]
      )

      // Registrar en auditoría con el usuario que hizo el cambio
      await db.query(
        `INSERT INTO auditoria_cambios (
          tabla_modificada, registro_id, tipo_cambio, 
          valor_anterior, valor_nuevo,
          usuario_id, usuario_nombre, razon_cambio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "comisiones_ventas",
          comisionId,
          "UPDATE",
          JSON.stringify(oldRows[0]),
          JSON.stringify(body),
          user.id,
          user.nombre,
          `Comisión marcada como ${estado_pago} por ${user.nombre}`,
        ]
      )

      return NextResponse.json({
        success: true,
        message: `Comisión marcada como ${estado_pago}`,
        actualizadoPor: user.nombre,
      })
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
  }
)
