import { NextResponse, NextRequest } from "next/server";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "crm",
};

// Crear el pool fuera para reutilizar conexiones
const pool = mysql.createPool(dbConfig);

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, nombre, email, rol, coordinador_id, estado, comision_base 
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
    const pool = mysql.createPool(dbConfig);
    connection = await pool.getConnection();

    await connection.beginTransaction();

    // 1. Crear el email automático e insertar el usuario
    const emailInterno = `${nombre.toLowerCase().replace(/\s+/g, '.')}@crm.local`;
    
    const [result]: any = await connection.execute(
      `INSERT INTO usuarios (nombre, password, email, rol, estado) VALUES (?, ?, ?, 'ASESOR', 'ACTIVO')`,
      [nombre, password, emailInterno]
    );

    const newUserId = result.insertId;

    // 2. Registrar en Auditoría la CREACIÓN
    // Guardamos los datos iniciales en valor_nuevo para tener registro de cómo empezó
    await connection.execute(
      `INSERT INTO auditoria_cambios 
      (tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo, usuario_nombre, razon_cambio) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'usuarios', 
        newUserId, 
        'INSERT', 
        null, // No hay valor anterior porque es nuevo
        JSON.stringify({ nombre, email: emailInterno, rol: 'ASESOR', estado: 'ACTIVO' }), 
        'Sistema Admin', 
        `Creación de nuevo usuario: ${nombre}`
      ]
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

    const dbField = field === 'role' ? 'rol' : field;

    // 1. Obtener datos actuales para la auditoría (evitar error si es password por privacidad)
    const [oldData]: any = await connection.execute(
      `SELECT ${dbField === 'password' ? 'id' : dbField}, nombre FROM usuarios WHERE id = ?`, 
      [userId]
    );

    // 2. Ejecutar la actualización
    await connection.execute(
      `UPDATE usuarios SET ${dbField} = ? WHERE id = ?`,
      [value === "null" ? null : value, userId]
    );

    // 3. Registrar en Auditoría
    const valorViejo = dbField === 'password' ? '***' : oldData[0][dbField];
    const valorNuevo = dbField === 'password' ? '***' : value;

    await connection.execute(
      `INSERT INTO auditoria_cambios 
      (tabla_modificada, registro_id, tipo_cambio, valor_anterior, valor_nuevo, usuario_nombre, razon_cambio) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'usuarios', 
        userId, 
        'UPDATE', 
        JSON.stringify({ [dbField]: valorViejo }), 
        JSON.stringify({ [dbField]: valorNuevo }), 
        'Sistema Admin', 
        `Cambio de ${dbField} para ${oldData[0].nombre}`
      ]
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