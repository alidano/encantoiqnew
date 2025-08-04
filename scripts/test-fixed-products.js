// scripts/test-fixed-products.js
const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';

async function testFixedProducts() {
  console.log('🛠️ Probando products con tipos de datos corregidos...');
  
  try {
    // Test de sincronización de productos
    console.log('🛒 Sincronizando products con fix de tipos...');
    const response = await fetch(`${API_BASE_URL}/api/sync/biotrack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncType: 'incremental',
        tables: ['products']
      })
    });

    const result = await response.json();
    
    console.log('📊 Resultado:');
    console.log(`   Success: ${result.success}`);
    
    if (result.success) {
      result.results.forEach(tableResult => {
        console.log(`\\n📦 ${tableResult.table.toUpperCase()}:`);
        console.log(`   Procesados: ${tableResult.recordsProcessed}`);
        console.log(`   Insertados: ${tableResult.recordsInserted}`);
        console.log(`   Actualizados: ${tableResult.recordsUpdated}`);
        console.log(`   Errores: ${tableResult.errors.length}`);
        
        if (tableResult.errors.length > 0) {
          console.log('\\n❌ Primeros errores:');
          tableResult.errors.slice(0, 3).forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`);
          });
        } else {
          console.log('\\n✅ ¡Sin errores! El fix funcionó.');
        }
      });
      
      // Resumen
      console.log('\\n📈 RESUMEN:');
      console.log(`   Total procesados: ${result.summary.totalRecords}`);
      console.log(`   Nuevos: ${result.summary.newRecords}`);
      console.log(`   Actualizados: ${result.summary.updatedRecords}`);
      console.log(`   Errores: ${result.summary.errors}`);
      
      if (result.summary.errors === 0) {
        console.log('\\n🎉 ¡PRODUCTOS SINCRONIZADOS EXITOSAMENTE!');
        console.log('   El problema de tipos de datos ha sido resuelto.');
      }
      
    } else {
      console.error('❌ Error en la sincronización:', result.error);
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

// Test rápido de sales también
async function testSales() {
  console.log('\\n💰 Probando sales con tipos corregidos...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync/biotrack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncType: 'incremental',
        tables: ['sales']
      })
    });

    const result = await response.json();
    
    if (result.success && result.results.length > 0) {
      const salesResult = result.results[0];
      console.log(`   Procesadas: ${salesResult.recordsProcessed} sales`);
      console.log(`   Insertadas: ${salesResult.recordsInserted}`);
      console.log(`   Actualizadas: ${salesResult.recordsUpdated}`);
      console.log(`   Errores: ${salesResult.errors.length}`);
      
      if (salesResult.errors.length === 0) {
        console.log('   ✅ Sales también funciona correctamente');
      }
    }
  } catch (error) {
    console.log('   ⚠️ Error en sales:', error.message);
  }
}

async function runAllTests() {
  await testFixedProducts();
  await testSales();
  
  console.log('\\n🏁 Tests completados.');
  console.log('\\n💡 Siguiente paso: Ir a http://localhost:3000/admin/sync');
  console.log('   y probar products y sales desde la interfaz web.');
}

runAllTests().catch(console.error);
