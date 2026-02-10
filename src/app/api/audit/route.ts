import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";
import { requirePermission } from "@/lib/api-auth";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "crm",
};

export const GET = requirePermission("view_audit", async (request: NextRequest) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Obtener parámetros de paginación y filtrado
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;
    const filterUsuario = url.searchParams.get("usuario");
    const filterTabla = url.searchParams.get("tabla");
    const filterTipo = url.searchParams.get("tipo");

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (filterUsuario) {
      whereClause += " AND usuario_nombre = ?";
      params.push(filterUsuario);
    }
    if (filterTabla) {
      whereClause += " AND tabla_modificada = ?";
      params.push(filterTabla);
    }
    if (filterTipo) {
      whereClause += " AND tipo_cambio = ?";
      params.push(filterTipo);
    }

    // Obtener total de registros
    const countQuery = `SELECT COUNT(*) as total FROM auditoria_cambios ${whereClause}`;
    const [countResult]: any = await connection.execute(countQuery, params);
    const total = countResult[0].total;

    // Obtener registros con paginación
    const query = `
      SELECT 
        id,
        usuario_nombre as usuario_id,
        tabla_modificada as tabla_afectada,
        tipo_cambio as tipo_operacion,
        valor_anterior as datos_anteriores,
        valor_nuevo as datos_nuevos,
        created_at as fecha_cambio,
        razon_cambio as descripcion
      FROM auditoria_cambios
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows]: any = await connection.execute(query, [...params, limit, offset]);

    // Obtener lista de usuarios y tablas para filtros
    const [usuarios]: any = await connection.execute(
      "SELECT DISTINCT usuario_nombre FROM auditoria_cambios WHERE usuario_nombre IS NOT NULL AND usuario_nombre != '' ORDER BY usuario_nombre"
    );
    const [tablas]: any = await connection.execute(
      "SELECT DISTINCT tabla_modificada FROM auditoria_cambios ORDER BY tabla_modificada"
    );
    const [tipos]: any = await connection.execute(
      "SELECT DISTINCT tipo_cambio FROM auditoria_cambios"
    );

    await connection.end();

    return NextResponse.json({
      data: rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      filters: {
        usuarios: usuarios.map((u: any) => u.usuario_nombre),
        tablas: tablas.map((t: any) => t.tabla_modificada),
        tipos: tipos.map((t: any) => t.tipo_cambio),
      },
    });
  } catch (error: any) {
    console.error("Audit API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
});