import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario en BD
    const [rows]: any = await db.query(
      `SELECT id, nombre, email, rol, operadora_asignada, password 
       FROM usuarios 
       WHERE email = ? AND estado = 'ACTIVO'`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Validar contraseña contra la BD
    // NOTA: En producción, usar bcrypt.compare(password, user.password)
    if (password !== user.password) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 }
      );
    }

    // Registrar login en auditoría
    await db.query(
      `INSERT INTO auditoria_cambios (
        tabla_modificada, registro_id, tipo_cambio, usuario_nombre, razon_cambio
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        "usuarios",
        user.id,
        "UPDATE",
        user.nombre,
        "Login realizado",
      ]
    );

    return NextResponse.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      operadora_asignada: user.operadora_asignada,
    });
  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error al autenticar" },
      { status: 500 }
    );
  }
}
