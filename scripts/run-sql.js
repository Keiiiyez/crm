#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm'
};

async function executeSqlFile(filePath) {
    const connection = await mysql.createConnection(DB_CONFIG);
    
    try {
        let sql = fs.readFileSync(filePath, 'utf8');
        
        // Remove comments
        sql = sql.replace(/--.*$/gm, '');  // Single line comments
        sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');  // Multi-line comments
        
        // Split by semicolon
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        console.log(`\n📄 Ejecutando: ${path.basename(filePath)}`);
        console.log(`📊 ${statements.length} comandos SQL encontrados\n`);
        
        let count = 0;
        let successCount = 0;
        
        for (const statement of statements) {
            // Skip DESCRIBE commands
            if (statement.toUpperCase().startsWith('DESCRIBE')) {
                console.log(`[${++count}/${statements.length}] DESCRIBE ⏭️  (omitido)`);
                continue;
            }
            
            try {
                const shortStmt = statement.length > 70 
                    ? statement.substring(0, 70) + '...' 
                    : statement;
                    
                process.stdout.write(`[${count + 1}/${statements.length}] ${shortStmt} `);
                
                await connection.execute(statement);
                successCount++;
                console.log('✅');
                count++;
            } catch (error) {
                count++;
                console.log('❌');
                
                // Ignore expected errors
                if (error.code === 'ER_DUP_ENTRY' || 
                    error.code === 'ER_TABLE_EXISTS_ERROR' || 
                    error.code === 'ER_DUP_KEYNAME' ||
                    error.code === 'ER_DUP_KEY_NAME') {
                    console.log(`   → ${error.code} (ignorado)\n`);
                } else {
                    console.error(`   ERROR: ${error.message}`);
                    console.error(`   SQL: ${statement}\n`);
                    throw error;
                }
            }
        }
        
        console.log(`\n✨ ${path.basename(filePath)} completado! (${successCount}/${statements.length} exitosos)\n`);
        
    } finally {
        await connection.end();
    }
}

async function main() {
    try {
        console.log('🚀 Ejecutando scripts SQL...\n');
        
        // Schema
        await executeSqlFile(path.join(__dirname, 'schema_fase1.sql'));
        
        // Usuarios
        await executeSqlFile(path.join(__dirname, 'usuarios_ejemplo.sql'));
        
        console.log('✅ ¡LISTO! Base de datos configurada correctamente\n');
        console.log('📝 Próximos pasos:');
        console.log('   1. npm run dev');
        console.log('   2. Abre: http://localhost:9002/login');
        console.log('   3. Email: juan@example.com\n');
        
    } catch (error) {
        console.error('❌ Error fatal:', error.message);
        process.exit(1);
    }
}

main();
