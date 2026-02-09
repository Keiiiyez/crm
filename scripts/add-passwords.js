const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm'
  });

  try {
    console.log('📝 Agregando columna password a tabla usuarios...');
    
    try {
      await conn.execute('ALTER TABLE usuarios ADD COLUMN password VARCHAR(255) DEFAULT "123456" AFTER email');
      console.log('✅ Columna password agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Columna password ya existe');
      } else {
        throw e;
      }
    }
    
    console.log('📝 Actualizando contraseñas de usuarios...');
    const result = await conn.execute('UPDATE usuarios SET password = "123456" WHERE email LIKE "%@example.com"');
    console.log('✅ Contraseñas actualizadas (todas: 123456)');
    
    console.log('\n👥 Usuarios listos para login:\n');
    const [rows] = await conn.execute(`
      SELECT id, nombre, email, rol, password 
      FROM usuarios 
      WHERE email LIKE "%@example.com" 
      ORDER BY FIELD(rol, 'ADMIN', 'GERENTE', 'COORDINADOR', 'ASESOR')
    `);
    
    rows.forEach((r, i) => {
      console.log(`${i + 1}. ${r.nombre}`);
      console.log(`   📧 Email: ${r.email}`);
      console.log(`   🔑 Password: ${r.password}`);
      console.log(`   👔 Rol: ${r.rol}\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
})();
