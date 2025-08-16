const { Client } = require('pg');

// Configuración de las 3 bases de datos
const databases = [
  {
    id: 'encanto-tree-og',
    name: 'Encanto Tree OG',
    host: '64.89.2.20',
    port: 5432,
    database: 'biotrackthc',
    user: 'egro',
    password: 'swfCi2i4R7NSuEe64TD40qYDuud',
    ssl: false,
  },
  {
    id: 'botanik-la-muda',
    name: 'Botanik (LA MUDA)',
    host: '173.239.206.254',
    port: 5432,
    database: 'biotrackthc',
    user: 'egro',
    password: '0TZ1ecWY9xzi3eCltpc1CaJvJ6L',
    ssl: false,
  },
  {
    id: 'new-encanto',
    name: 'New Encanto',
    host: '64.89.2.17',
    port: 5432,
    database: 'biotrackthc',
    user: 'egro',
    password: 'rMbIHcXYW652iWzWX6Vo5Zx0uN7',
    ssl: false,
  },
];

async function checkTableStructure(dbConfig) {
  const client = new Client(dbConfig);
  
  try {
    console.log(`\n🔍 Conectando a: ${dbConfig.name} (${dbConfig.host})`);
    await client.connect();
    console.log(`✅ Conectado exitosamente`);
    
    // Ver estructura de la tabla customers
    console.log(`\n📋 Estructura de la tabla customers:`);
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(structureQuery);
    structureResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Ver algunos ejemplos de datos
    console.log(`\n📊 Ejemplos de datos de customers:`);
    const sampleQuery = `
      SELECT * FROM customers 
      WHERE deleted = 0 
      LIMIT 3;
    `;
    
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach((row, index) => {
      console.log(`\n   Customer ${index + 1}:`);
      Object.keys(row).forEach(key => {
        if (row[key] !== null && row[key] !== undefined) {
          console.log(`     ${key}: ${row[key]}`);
        }
      });
    });
    
    // Buscar campos que podrían contener números de licencia
    console.log(`\n🔍 Buscando campos que podrían contener números de licencia:`);
    const licenseFields = ['licensenum', 'license', 'redcard', 'card', 'mmj', 'medical'];
    
    for (const field of licenseFields) {
      try {
        const checkQuery = `
          SELECT COUNT(*) as count, 
                 COUNT(CASE WHEN ${field} LIKE 'PA%' THEN 1 END) as pa_count
          FROM customers 
          WHERE deleted = 0;
        `;
        
        const checkResult = await client.query(checkQuery);
        const count = checkResult.rows[0].count;
        const paCount = checkResult.rows[0].pa_count;
        
        if (count > 0) {
          console.log(`   Campo '${field}': ${count} registros, ${paCount} con PA`);
        }
      } catch (error) {
        // Campo no existe, continuar
      }
    }
    
  } catch (error) {
    console.error(`❌ Error en ${dbConfig.name}:`, error.message);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Verificando estructura de la tabla customers en las 3 bases de datos...\n');
  
  for (const dbConfig of databases) {
    await checkTableStructure(dbConfig);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 PRÓXIMOS PASOS:');
  console.log('   1. Identificar el campo correcto que contiene los números de licencia');
  console.log('   2. Verificar si el formato es diferente a "PA%"');
  console.log('   3. Ajustar las queries según la estructura real');
  console.log('='.repeat(80));
}

main().catch(console.error);
