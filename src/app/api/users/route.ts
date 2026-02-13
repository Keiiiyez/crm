import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "crm",
};

const pool = mysql.createPool(dbConfig);

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, email, rol, coordinador_id as coordinadorId, estado, comision_base 
      FROM usuarios 
      ORDER BY FIELD(estado, 'ACTIVO', 'PERMISO', 'INACTIVO'), nombre ASC
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { nombre, password } = await request.json();
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const emailInterno = `${nombre.toLowerCase().replace(/\s+/g, '.')}@crm.local`;
    
    const [result]: any = await connection.execute(
      `INSERT INTO usuarios (nombre, password, email, rol, estado) VALUES (?, ?, ?, 'ASESOR', 'ACTIVO')`,
      [nombre, password, emailInterno]
    );

    const newUserId = result.insertId;

    await connection.execute(
      `INSERT INTO auditoria_cambios 
      (tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo, usuario_nombre, razon_cambio) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['usuarios', newUserId, 'INSERT', null, JSON.stringify({ nombre, rol: 'ASESOR' }), 'Sistema Admin', `Creación: ${nombre}`]
    );

    await connection.commit();
    return NextResponse.json({ success: true, userId: newUserId });
  } catch (error: any) {
    if (connection) await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PATCH(request: NextRequest) {
  let connection;
  try {
    const { userId, field, value } = await request.json();
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Mapeo de nombres JS a nombres DB
    const mapping: Record<string, string> = {
      role: 'rol',
      coordinadorId: 'coordinador_id',
      estado: 'estado',
      password: 'password'
    };

    const dbField = mapping[field] || field;

    // 1. Obtener datos viejos para auditoría
    const [oldDataRows]: any = await connection.execute(
      `SELECT * FROM usuarios WHERE id = ?`, [userId]
    );
    if (oldDataRows.length === 0) throw new Error("Usuario no encontrado");
    const oldUser = oldDataRows[0];

    // 2. Limpiar valor para SQL (manejo de nulos)
    let finalValue = value;
    if (dbField === 'coordinador_id' && (value === 0 || value === "0" || value === null)) {
      finalValue = null;
    }

    // 3. Ejecutar Update
    await connection.execute(
      `UPDATE usuarios SET ${dbField} = ? WHERE id = ?`,
      [finalValue, userId]
    );

    // 4. Auditoría
    const valorViejo = dbField === 'password' ? '***' : oldUser[dbField];
    const valorNuevo = dbField === 'password' ? '***' : finalValue;

    await connection.execute(
      `INSERT INTO auditoria_cambios 
      (tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo, usuario_nombre, razon_cambio) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['usuarios', userId, 'UPDATE', JSON.stringify({[dbField]: valorViejo}), JSON.stringify({[dbField]: valorNuevo}), 'Sistema Admin', `Cambio ${dbField}`]
    );

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (connection) await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}