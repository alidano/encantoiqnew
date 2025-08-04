// scripts/sync-sales-full.js
// Script para ejecutar sync completo de sales (2024 + 2025)

const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000';

async function fullSalesSync() {
  console.log('🌙 Iniciando sincronización completa de sales...');
  console.log('📅 Obtendrá datos desde enero 2024 hasta ahora');
  console.log('⏱️  Esto puede tomar 15-30 minutos...');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Enviando request de sync completo...');
    
    const response = await fetch(`${API_BASE_URL}/api/sync/biotrack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncType: 'full',  // Sync completo
        tables: ['sales']  // Solo sales
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('');
    console.log('🎉 SINCRONIZACIÓN COMPLETA FINALIZADA!');
    console.log('⏱️  Duración total:', `${Math.floor(duration / 60)}:${duration % 60} minutos`);
    console.log('');
    
    if (result.success) {
      result.results.forEach(tableResult => {
        console.log(`📊 ${tableResult.table.toUpperCase()}:`);
        console.log(`   Procesados: ${tableResult.recordsProcessed.toLocaleString()}`);
        console.log(`   Insertados: ${tableResult.recordsInserted.toLocaleString()}`);
        console.log(`   Actualizados: ${tableResult.recordsUpdated.toLocaleString()}`);
        console.log(`   Errores: ${tableResult.errors.length}`);
        console.log('');
        
        if (tableResult.errors.length > 0) {
          console.log('❌ Errores encontrados:');
          tableResult.errors.slice(0, 5).forEach((error, i) => {
            console.log(`   ${i + 1}. ${error}`);
          });
          if (tableResult.errors.length > 5) {
            console.log(`   ... y ${tableResult.errors.length - 5} errores más`);
          }
          console.log('');
        }
      });
      
      // Resumen final
      console.log('📈 RESUMEN FINAL:');
      console.log(`   Total procesados: ${result.summary.totalRecords.toLocaleString()}`);
      console.log(`   Nuevos: ${result.summary.newRecords.toLocaleString()}`);
      console.log(`   Actualizados: ${result.summary.updatedRecords.toLocaleString()}`);
      console.log(`   Errores: ${result.summary.errors}`);
      console.log('');
      
      if (result.summary.errors === 0) {
        console.log('✅ ¡SINCRONIZACIÓN EXITOSA!');
        console.log('📊 Ya puedes crear tu dashboard comparativo 2024 vs 2025');
      } else {
        console.log('⚠️  Sincronización completada con algunos errores');
      }
      
    } else {
      console.error('❌ Error en la sincronización:', result.error);
    }

  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error('');
    console.error('💥 Error durante la sincronización:', error.message);
    console.error('⏱️  Tiempo transcurrido:', `${Math.floor(duration / 60)}:${duration % 60} minutos`);
    console.error('');
    console.error('🔧 Posibles soluciones:');
    console.error('   1. Verificar que el servidor esté corriendo (npm run dev)');
    console.error('   2. Verificar conexión a BioTrack');
    console.error('   3. Revisar logs del servidor');
  }
}

// Mostrar información antes de empezar
console.log('🌙 SYNC NOCTURNO DE SALES - DATOS HISTÓRICOS');
console.log('='.repeat(50));
console.log('📅 Período: Enero 2024 - Presente');
console.log('🎯 Objetivo: Dashboard comparativo año sobre año');
console.log('⏱️  Duración estimada: 15-30 minutos');
console.log('📊 Datos estimados: ~100,000-200,000 sales');
console.log('');

// Ejecutar
fullSalesSync().catch(console.error);
