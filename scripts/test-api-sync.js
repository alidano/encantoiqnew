// scripts/test-full-sync.js
const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';

async function testSync() {
  console.log('🚀 Probando sincronización completa...');
  
  try {
    // 1. Test de conexión
    console.log('🔍 1. Probando conexión...');
    const statusResponse = await fetch(`${API_BASE_URL}/api/sync/biotrack`);
    const statusData = await statusResponse.json();
    
    if (statusData.success && statusData.connected) {
      console.log('✅ Conexión exitosa');
      console.log('📊 Conteos en BioTrack:');
      Object.entries(statusData.tableCounts).forEach(([table, count]) => {
        console.log(`   ${table}: ${count.toLocaleString()}`);
      });
    } else {
      console.error('❌ No se pudo conectar a BioTrack');
      return;
    }

    // 2. Test de sincronización de productos
    console.log('\\n🛒 2. Sincronizando products...');
    const productsSync = await fetch(`${API_BASE_URL}/api/sync/biotrack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncType: 'incremental',
        tables: ['products']
      })
    });

    const productsResult = await productsSync.json();
    if (productsResult.success) {
      console.log('✅ Products sincronizados exitosamente');
      productsResult.results.forEach(result => {
        console.log(`   ${result.table}: ${result.recordsInserted} nuevos, ${result.recordsUpdated} actualizados`);
        if (result.errors.length > 0) {
          console.log(`   ⚠️ ${result.errors.length} errores`);
        }
      });
    } else {
      console.error('❌ Error sincronizando products:', productsResult.error);
    }

    // 3. Test de sincronización de sales
    console.log('\\n💰 3. Sincronizando sales...');
    const salesSync = await fetch(`${API_BASE_URL}/api/sync/biotrack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncType: 'incremental',
        tables: ['sales']
      })
    });

    const salesResult = await salesSync.json();
    if (salesResult.success) {
      console.log('✅ Sales sincronizadas exitosamente');
      salesResult.results.forEach(result => {
        console.log(`   ${result.table}: ${result.recordsInserted} nuevos, ${result.recordsUpdated} actualizados`);
        if (result.errors.length > 0) {
          console.log(`   ⚠️ ${result.errors.length} errores`);
        }
      });
    } else {
      console.error('❌ Error sincronizando sales:', salesResult.error);
    }

    // 4. Test de sincronización completa
    console.log('\\n🎯 4. Sincronización completa...');
    const fullSync = await fetch(`${API_BASE_URL}/api/sync/biotrack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncType: 'incremental',
        tables: ['customers', 'products', 'sales']
      })
    });

    const fullResult = await fullSync.json();
    if (fullResult.success) {
      console.log('🎉 Sincronización completa exitosa');
      console.log('📊 Resumen:', fullResult.summary);
      
      console.log('\\n📋 Detalles por tabla:');
      fullResult.results.forEach(result => {
        console.log(`   ${result.table.toUpperCase()}:`);
        console.log(`     - Procesados: ${result.recordsProcessed}`);
        console.log(`     - Nuevos: ${result.recordsInserted}`);
        console.log(`     - Actualizados: ${result.recordsUpdated}`);
        console.log(`     - Errores: ${result.errors.length}`);
      });
    } else {
      console.error('❌ Error en sincronización completa:', fullResult.error);
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

// Función para testing rápido de products solamente
async function testProductsOnly() {
  console.log('🛒 Test rápido: solo productos...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/sync/biotrack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncType: 'incremental',
        tables: ['products']
      })
    });

    const result = await response.json();
    console.log('📊 Resultado:', result);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar basado en argumentos
const command = process.argv[2];
if (command === 'products') {
  testProductsOnly().catch(console.error);
} else {
  testSync().catch(console.error);
}
