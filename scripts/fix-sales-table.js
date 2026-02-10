const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'crm'
};

async function fixSalesTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Checking sales table structure...');
    
    // Check if columns exist
    const result = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'sales' AND TABLE_SCHEMA = 'crm'
    `);
    const columns = result[0];
    const columnNames = columns.map((col) => col.COLUMN_NAME);
    console.log('Current columns:', columnNames);
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'usuario_id', type: 'INT', exists: columnNames.includes('usuario_id') },
      { name: 'usuario_nombre', type: 'VARCHAR(100)', exists: columnNames.includes('usuario_nombre') },
      { name: 'contrato_id', type: 'INT', exists: columnNames.includes('contrato_id') }
    ];
    
    for (const col of columnsToAdd) {
      if (!col.exists) {
        console.log(`Adding column ${col.name}...`);
        await connection.execute(`ALTER TABLE sales ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✓ Column ${col.name} added successfully`);
      } else {
        console.log(`✓ Column ${col.name} already exists`);
      }
    }
    
    console.log('\n✓ Sales table is ready!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

fixSalesTable();
