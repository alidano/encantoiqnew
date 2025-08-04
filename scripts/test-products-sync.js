// scripts/test-products-sync.js
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

async function testProductsQuery() {
  console.log('🛒 Probando query de productos...');
  
  const client = new Client(biotrackConfig);

  try {
    await client.connect();
    console.log('✅ Conectado a BioTrack');

    // Test de productos
    const query = `
      SELECT 
        id, name, taxcategory, productcategory, applymemberdiscount,
        strain, pricepoint, image, location, deleted, modified_on
      FROM products
      WHERE deleted = 0
      ORDER BY modified_on DESC
      LIMIT 5
    `;

    console.log('🔍 Ejecutando query de productos...');
    const result = await client.query(query);
    
    console.log(`📦 Encontrados ${result.rows.length} productos:`);
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.name} (ID: ${row.id})`);
      console.log(`     Categoría: ${row.productcategory}`);
      console.log(`     Strain: ${row.strain || 'N/A'}`);
      console.log(`     Price Point: ${row.pricepoint || 'N/A'}`);
      console.log(`     Modificado: ${row.modified_on}`);
      console.log('');
    });

    // Test de sales
    console.log('💰 Probando query de sales...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
    
    const salesQuery = `
      SELECT 
        id, ticketid, strain, price, tax, total,
        customerid, productid, datetime, location
      FROM sales
      WHERE deleted = 0 
        AND datetime > ${timestamp}
      ORDER BY datetime DESC
      LIMIT 5
    `;

    const salesResult = await client.query(salesQuery);
    console.log(`💰 Encontradas ${salesResult.rows.length} sales (últimos 30 días):`);
    
    salesResult.rows.forEach((row, i) => {
      const saleDate = new Date(row.datetime * 1000).toLocaleDateString();
      console.log(`  ${i + 1}. Sale ${row.id} - $${row.total} (${saleDate})`);
      console.log(`     Customer: ${row.customerid}, Product: ${row.productid}`);
      console.log(`     Ticket: ${row.ticketid}`);
      console.log('');
    });

    // Contar totales
    const totalProducts = await client.query('SELECT COUNT(*) as count FROM products WHERE deleted = 0');
    const totalSales = await client.query(`SELECT COUNT(*) as count FROM sales WHERE deleted = 0 AND datetime > ${timestamp}`);
    
    console.log('📊 Totales:');
    console.log(`   Productos activos: ${totalProducts.rows[0].count}`);
    console.log(`   Sales (30 días): ${totalSales.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testProductsQuery().catch(console.error);
