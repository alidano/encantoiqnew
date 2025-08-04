// scripts/test-connection.js
const { Client } = require('pg');
require('dotenv').config();

const biotrackConfig = {
  host: process.env.BIOTRACK_HOST || '64.89.2.20',
  port: parseInt(process.env.BIOTRACK_PORT || '5432'),
  database: process.env.BIOTRACK_DATABASE || 'biotrackthc',
  user: process.env.BIOTRACK_USER || 'egro',
  password: process.env.BIOTRACK_PASSWORD || 'swfCi2i4R7NSuEe64TD40qYDuud',
  ssl: false,
};

async function testConnection() {
  console.log('🔍 Probando conexión a BioTrack...');
  console.log('📊 Configuración:', {
    host: biotrackConfig.host,
    port: biotrackConfig.port,
    database: biotrackConfig.database,
    user: biotrackConfig.user,
    password: '***' // Ocultar password
  });

  const client = new Client(biotrackConfig);

  try {
    await client.connect();
    console.log('✅ Conexión exitosa a BioTrack!');

    // Test simple
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Query test exitoso:', result.rows[0]);

    // Obtener conteos de tablas
    const tables = ['customers', 'payments', 'products', 'sales'];
    console.log('\n📊 Conteos de tablas:');
    
    for (const table of tables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table} WHERE deleted = 0`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`  ${table}: ${count.toLocaleString()} registros`);
      } catch (error) {
        console.log(`  ${table}: Error - ${error.message}`);
      }
    }

    // Test de estructura de customers
    console.log('\n🔍 Verificando estructura de customers:');
    const structureResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      ORDER BY ordinal_position 
      LIMIT 10
    `);
    
    console.log('  Primeros 10 campos:');
    structureResult.rows.forEach(row => {
      console.log(`    ${row.column_name}: ${row.data_type}`);
    });

    // Sample data
    console.log('\n📋 Muestra de datos (customers):');
    const sampleResult = await client.query(`
      SELECT customerid, firstname, lastname, licenseexpmonth, licenseexpyear, modified_on 
      FROM customers 
      WHERE deleted = 0 
      ORDER BY modified_on DESC 
      LIMIT 3
    `);
    
    sampleResult.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.firstname} ${row.lastname} (${row.customerid})`);
      console.log(`     Licencia expira: ${row.licenseexpmonth}/${row.licenseexpyear}`);
      console.log(`     Modificado: ${row.modified_on}`);
    });

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('💡 Detalles:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🔍 El servidor no se encuentra. Verifica la IP y que esté accesible.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Conexión rechazada. Verifica el puerto y que PostgreSQL esté corriendo.');
    } else if (error.code === '28P01') {
      console.error('🔍 Error de autenticación. Verifica usuario y password.');
    }
  } finally {
    await client.end();
  }
}

testConnection().catch(console.error);
