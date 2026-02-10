import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/api-auth";

// GET: Ver contratos - requiere permiso view_contracts
export const GET = requirePermission(
  "view_contracts",
  async (request: NextRequest, user) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          c.*,
          cli.name as cliente_nombre,
          cli.dni as cliente_dni,
          cli.phone as cliente_phone,
          cli.email as cliente_email,
          cli.province as cliente_provincia
        FROM contratos c
        LEFT JOIN clientes cli ON c.cliente_id = cli.id
        ORDER BY c.created_at DESC
      `);
      return NextResponse.json(rows);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
);

// POST: Crear contrato - requiere permiso create_contract
export const POST = requirePermission(
  "create_contract",
  async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const {
        cliente_id,
        numero_contrato,
        operadora_origen,
        operadora_destino,
        tipo_contrato,
        servicios,
        precio_total,
        fecha_inicio,
        fecha_renovacion,
        asesor_id,
        asesor_nombre,
        notas,
        vigencia_meses,
        datos_portabilidad,
      } = body;

      if (!cliente_id || !numero_contrato || !operadora_destino) {
        return NextResponse.json(
          { error: "Faltan campos obligatorios" },
          { status: 400 }
        );
      }

      const [result]: any = await db.query(
        `INSERT INTO contratos (
          cliente_id, numero_contrato, operadora_origen, operadora_destino,
          tipo_contrato, servicios, precio_total, fecha_inicio, fecha_renovacion,
          estado, asesor_id, asesor_nombre, notas, vigencia_meses, datos_portabilidad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cliente_id,
          numero_contrato,
          operadora_origen || null,
          operadora_destino,
          tipo_contrato || "NUEVA_LINEA",
          JSON.stringify(servicios || []),
          precio_total,
          fecha_inicio,
          fecha_renovacion || null,
          "PENDIENTE_TRAMITACION",
          asesor_id || null,
          asesor_nombre || null,
          notas || null,
          vigencia_meses || 24,
          datos_portabilidad ? JSON.stringify(datos_portabilidad) : null,
        ]
      );

      // Registrar en auditoría
      await db.query(
        `INSERT INTO auditoria_cambios (
          tabla_modificada, registro_id, tipo_cambio, valor_nuevo,
          usuario_nombre, razon_cambio
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          "contratos",
          result.insertId,
          "INSERT",
          JSON.stringify(body),
          user.nombre,
          "Nuevo contrato creado",
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Contrato creado exitosamente",
        contractId: result.insertId,
      });
    } catch (error: any) {
      console.error("Error en POST contratos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
);
