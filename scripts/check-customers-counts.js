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

// Query para contar customers con redcard que comience en "PA"
const countQuery = `
  SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN redcard LIKE 'PA%' THEN 1 END) as pa_customers,
    COUNT(CASE WHEN redcard NOT LIKE 'PA%' THEN 1 END) as non_pa_customers,
    COUNT(CASE WHEN redcard IS NULL OR redcard = '' THEN 1 END) as no_redcard
  FROM customers
  WHERE deleted = 0;
`;

// Query para ver algunos ejemplos de redcards
const sampleQuery = `
  SELECT 
    customerid,
    firstname,
    lastname,
    redcard,
    location
  FROM customers 
  WHERE deleted = 0 
    AND redcard LIKE 'PA%'
  ORDER BY customerid
  LIMIT 10;
`;

// Query para ver la distribución de ubicaciones
const locationQuery = `
  SELECT 
    location,
    COUNT(*) as customer_count
  FROM customers 
  WHERE deleted = 0 
    AND redcard LIKE 'PA%'
  GROUP BY location
  ORDER BY location;
`;

async function checkDatabase(dbConfig) {
  const client = new Client(dbConfig);
  
  try {
    console.log(`\n🔍 Conectando a: ${dbConfig.name} (${dbConfig.host})`);
    await client.connect();
    console.log(`✅ Conectado exitosamente`);
    
    // Contar totales
    console.log(`\n📊 Contando customers...`);
    const countResult = await client.query(countQuery);
    const counts = countResult.rows[0];
    
    console.log(`   Total Customers: ${counts.total_customers.toLocaleString()}`);
    console.log(`   PA Redcard: ${counts.pa_customers.toLocaleString()}`);
    console.log(`   Non-PA Redcard: ${counts.non_pa_customers.toLocaleString()}`);
    console.log(`   Sin Redcard: ${counts.no_redcard.toLocaleString()}`);
    
    // Ver ejemplos de redcards PA
    console.log(`\n🔑 Ejemplos de Redcards PA:`);
    const sampleResult = await client.query(sampleQuery);
    sampleResult.rows.forEach(row => {
      console.log(`   ID: ${row.customerid}, ${row.firstname} ${row.lastname}, Redcard: ${row.redcard}, Location: ${row.location}`);
    });
    
    // Ver distribución de ubicaciones
    console.log(`\n📍 Distribución de ubicaciones para customers PA:`);
    const locationResult = await client.query(locationQuery);
    locationResult.rows.forEach(row => {
      console.log(`   Location ${row.location}: ${row.customer_count.toLocaleString()} customers`);
    });
    
    return {
      total: counts.total_customers,
      pa: counts.pa_customers,
      nonPa: counts.non_pa_customers,
      noRedcard: counts.no_redcard
    };
    
  } catch (error) {
    console.error(`❌ Error en ${dbConfig.name}:`, error.message);
    return null;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Verificando totales de customers en las 3 bases de datos...\n');
  
  const results = [];
  
  for (const dbConfig of databases) {
    const result = await checkDatabase(dbConfig);
    if (result) {
      results.push({
        name: dbConfig.name,
        ...result
      });
    }
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(80));
  console.log('📈 RESUMEN FINAL');
  console.log('='.repeat(80));
  
  let totalCustomers = 0;
  let totalPaCustomers = 0;
  
  results.forEach(result => {
    console.log(`\n${result.name}:`);
    console.log(`   Total: ${result.total.toLocaleString()}`);
    console.log(`   PA Redcard: ${result.pa.toLocaleString()}`);
    console.log(`   Porcentaje PA: ${((result.pa / result.total) * 100).toFixed(1)}%`);
    
    totalCustomers += result.total;
    totalPaCustomers += result.pa;
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎯 TOTAL GENERAL: ${totalCustomers.toLocaleString()} customers`);
  console.log(`🎯 TOTAL PA REDCARD: ${totalPaCustomers.toLocaleString()} customers`);
  console.log(`🎯 PORCENTAJE TOTAL PA: ${((totalPaCustomers / totalCustomers) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  // Comparar con Supabase
  console.log(`\n📊 COMPARACIÓN CON SUPABASE:`);
  console.log(`   Total en BioTrack: ${totalPaCustomers.toLocaleString()}`);
  console.log(`   Total en Supabase: 25,389`);
  console.log(`   Diferencia: ${(totalPaCustomers - 25389).toLocaleString()}`);
  console.log(`   Porcentaje sincronizado: ${((25389 / totalPaCustomers) * 100).toFixed(1)}%`);
}

main().catch(console.error);
