import { NextResponse, NextRequest } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", 
  database: "crm", 
};

export const GET = requirePermission("view_sales", async (request: NextRequest, user) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows]: any = await connection.execute(`
      SELECT 
        s.id, 
        s.cliente_id as clienteId, 
        c.name as clientName, 
        c.dni as clienteDni,
        c.phone as clientPhone,
        c.email as clientEmail,
        c.address as clientAddress,
        c.city as clientCity,
        c.postalCode as clientPostalCode,
        s.operador_destino as operadorDestino, 
        s.precio_cierre as precioCierre, 
        s.status, 
        s.observaciones, 
        s.usuario_nombre as usuarioNombre,
        s.usuario_id as usuarioId,
        s.contrato_id as contratoId,
        s.fecha as createdAt
      FROM sales s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      ORDER BY s.fecha DESC
    `);

    const [items]: any = await connection.execute(`
      SELECT 
        si.sale_id,
        si.nombre_servicio,
        si.precio_base,
        p.fiber,
        p.mobile_main_gb,
        p.mobile_main_speed,
        p.tv_package,
        p.streaming_services,
        p.extra_lines
      FROM sale_items si
      LEFT JOIN products p ON si.nombre_servicio = p.name
    `);

    const salesWithItems = rows.map((sale: any) => ({
      ...sale,
      clientFull: {
        phone: sale.clientPhone,
        email: sale.clientEmail,
        address: sale.clientAddress,
        city: sale.clientCity,
        postalCode: sale.clientPostalCode
      },
      servicios: items
        .filter((item: any) => item.sale_id === sale.id)
        .map((item: any) => ({ 
            nombre: item.nombre_servicio, 
            precioBase: item.precio_base,
            fiber: item.fiber,
            mobile_main_gb: item.mobile_main_gb,
            mobile_main_speed: item.mobile_main_speed,
            tv_package: item.tv_package,
            streaming_services: item.streaming_services,
            extra_lines: item.extra_lines
        }))
    }));

    return NextResponse.json(salesWithItems);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
});

export const POST = requirePermission("create_sale", async (request: NextRequest, user) => {
  let connection;
  try {
    const body = await request.json();
    const { clienteId, operadorDestino, servicios, precioCierre, observaciones, usuario_id, usuario_nombre } = body;

    // Validar datos requeridos
    if (!clienteId || !operadorDestino || !servicios || servicios.length === 0) {
      return NextResponse.json(
        { error: "Datos requeridos faltantes" },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection(dbConfig);

    // Generar número de contrato único
    const numeroContrato = `CTR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear registro en tabla contratos primero
    const [contractResult]: any = await connection.execute(
      `INSERT INTO contratos (
        cliente_id, numero_contrato, operadora_destino, tipo_contrato,
        servicios, precio_total, fecha_inicio, estado, asesor_id, asesor_nombre
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
      [
        clienteId,
        numeroContrato,
        operadorDestino,
        "NUEVA_LINEA",
        JSON.stringify(servicios),
        precioCierre || 0,
        "PENDIENTE_TRAMITACION",
        usuario_id,
        usuario_nombre
      ]
    );

    const contratoId = contractResult.insertId;

    // Crear registro en tabla sales
    const [saleResult]: any = await connection.execute(
      `INSERT INTO sales (cliente_id, operador_destino, precio_cierre, status, observaciones, usuario_id, usuario_nombre, contrato_id, fecha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [clienteId, operadorDestino, precioCierre || 0, "PENDIENTE", observaciones || "", usuario_id, usuario_nombre, contratoId]
    );

    const saleId = saleResult.insertId;

    // Crear registros en tabla sale_items
    for (const servicio of servicios) {
      await connection.execute(
        `INSERT INTO sale_items (sale_id, nombre_servicio, precio_base)
         VALUES (?, ?, ?)`,
        [saleId, servicio.nombre, servicio.precioBase || 0]
      );
    }

    // Registrar en auditoría
    await connection.execute(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, valor_nuevo,
        usuario_nombre, razon_cambio
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "sales",
        saleId,
        "INSERT",
        JSON.stringify(body),
        usuario_nombre,
        `Venta registrada - Contrato #${numeroContrato}`
      ]
    );

    // Devolver la venta creada
    return NextResponse.json(
      {
        id: saleId,
        clienteId,
        operadorDestino,
        precioCierre,
        status: "PENDIENTE",
        servicios,
        usuarioNombre: usuario_nombre,
        contratoId,
        numeroContrato,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear la venta" },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
});