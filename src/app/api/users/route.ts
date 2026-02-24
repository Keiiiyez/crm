import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = { host: "127.0.0.1", user: "root", password: "", database: "crm" };
const pool = mysql.createPool(dbConfig);

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { nombre, password, editorNombre } = await request.json(); // <--- RECIBE EDITOR
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const emailInterno = `${nombre.toLowerCase().replace(/\s+/g, '.')}@ivhaes.com`;
    const [result]: any = await connection.execute(
      `INSERT INTO usuarios (nombre, password, email, rol, estado) VALUES (?, ?, ?, 'ASESOR', 'ACTIVO')`,
      [nombre, password, emailInterno]
    );

    // AUDITORÍA CON NOMBRE REAL
    await connection.execute(
      `INSERT INTO auditoria_cambios (tabla_modificada, registro_id, tipo_cambio, valor_nuevo, usuario_nombre, razon_cambio) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['usuarios', result.insertId, 'INSERT', JSON.stringify({ nombre }), editorNombre || 'Admin Sistema', `Creó al usuario: ${nombre}`]
    );

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (connection) await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally { if (connection) connection.release(); }
}

export async function PATCH(request: NextRequest) {
  let connection;
  try {
    const { userId, field, value, editorNombre } = await request.json(); // <--- RECIBE EDITOR
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const mapping: Record<string, string> = { role: 'rol', coordinadorId: 'coordinador_id', estado: 'estado', password: 'password' };
    const dbField = mapping[field] || field;

    // Obtener nombre del usuario afectado para la descripción
    const [oldRows]: any = await connection.execute(`SELECT nombre FROM usuarios WHERE id = ?`, [userId]);
    const targetName = oldRows[0]?.nombre || 'Usuario';

    await connection.execute(`UPDATE usuarios SET ${dbField} = ? WHERE id = ?`, [value, userId]);

    // AUDITORÍA CON NOMBRE REAL
    await connection.execute(
      `INSERT INTO auditoria_cambios (tabla_modificada, registro_id, tipo_cambio, valor_nuevo, usuario_nombre, razon_cambio) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['usuarios', userId, 'UPDATE', JSON.stringify({[field]: value}), editorNombre || 'Admin Sistema', `Editó ${field} de ${targetName}`]
    );

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (connection) await connection.rollback();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally { if (connection) connection.release(); }
}

export async function GET() {
  const [rows] = await pool.execute("SELECT id, nombre, email, rol, estado, coordinador_id as coordinadorId FROM usuarios ORDER BY nombre ASC");
  return NextResponse.json(rows);
}