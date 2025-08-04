// scripts/sync-biotrack.js
const { biotrackSync } = require('../src/services/biotrackSyncService');

async function runSync() {
  console.log('🚀 Iniciando sincronización automática de BioTrack...');
  
  try {
    // Test de conexión
    const connected = await biotrackSync.testConnection();
    if (!connected) {
      console.error('❌ No se pudo conectar a BioTrack');
      process.exit(1);
    }

    console.log('✅ Conexión a BioTrack exitosa');

    // Obtener conteos actuales
    const counts = await biotrackSync.getTableCounts();
    console.log('📊 Conteos en BioTrack:', counts);

    // Ejecutar sincronización incremental
    const { results, summary } = await biotrackSync.syncAll(false);

    console.log('\n📈 RESUMEN DE SINCRONIZACIÓN:');
    console.log(`⏱️  Duración: ${summary.duration}ms`);
    console.log(`📦 Total procesados: ${summary.totalRecords}`);
    console.log(`➕ Nuevos: ${summary.newRecords}`);
    console.log(`🔄 Actualizados: ${summary.updatedRecords}`);
    console.log(`❌ Errores: ${summary.errors}`);

    console.log('\n📋 DETALLES POR TABLA:');
    results.forEach(result => {
      console.log(`\n${result.table.toUpperCase()}:`);
      console.log(`  - Procesados: ${result.recordsProcessed}`);
      console.log(`  - Insertados: ${result.recordsInserted}`);
      console.log(`  - Actualizados: ${result.recordsUpdated}`);
      console.log(`  - Errores: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log('  - Primeros errores:');
        result.errors.slice(0, 3).forEach(error => {
          console.log(`    • ${error}`);
        });
      }
    });

    if (summary.errors === 0) {
      console.log('\n🎉 Sincronización completada exitosamente!');
    } else {
      console.log(`\n⚠️  Sincronización completada con ${summary.errors} errores`);
    }

  } catch (error) {
    console.error('💥 Error en sincronización:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runSync().catch(console.error);
}

module.exports = { runSync };
