// Script de prueba para verificar la nueva función de conversión de timestamps
// Este script simula la lógica actualizada que maneja diferentes tipos de campos

console.log('🧪 Probando conversión de timestamps con tipos de campo...\n');

// Función de conversión actualizada (copiada del sync)
function convertTimestamp(timestamp, fieldType = 'bigint') {
  if (!timestamp) return null;
  try {
    // Si es un string con comas, limpiarlo
    const cleanTimestamp = timestamp.toString().replace(/,/g, '');
    const unixTime = parseInt(cleanTimestamp);
    
    // Validar que sea un número válido
    if (isNaN(unixTime)) return null;
    
    // Validar que esté en un rango razonable (desde 1970 hasta 2030)
    const minTimestamp = 0; // 1 enero 1970
    const maxTimestamp = 1893456000; // 1 enero 2030
    
    if (unixTime < minTimestamp || unixTime > maxTimestamp) {
      console.log(`⚠️  Timestamp fuera de rango válido: ${unixTime} (${new Date(unixTime * 1000).toISOString()})`);
      return null;
    }
    
    // Según el tipo de campo, retornar bigint o ISO string
    if (fieldType === 'bigint') {
      return unixTime; // Mantener como bigint para Supabase
    } else {
      return new Date(unixTime * 1000).toISOString(); // Convertir a ISO para campos timestamp
    }
  } catch (error) {
    console.log(`⚠️  Error converting timestamp ${timestamp}:`, error);
    return null;
  }
}

// Casos de prueba para diferentes tipos de campos
const testCases = [
  // Campos bigint (mantienen Unix timestamp)
  { 
    input: '1744948799', 
    fieldType: 'bigint', 
    description: 'createdate (bigint) - Timestamp futuro válido',
    expectedType: 'bigint'
  },
  { 
    input: '1686369599', 
    fieldType: 'bigint', 
    description: 'membersince (bigint) - Timestamp pasado válido',
    expectedType: 'bigint'
  },
  { 
    input: '0', 
    fieldType: 'bigint', 
    description: 'createdate (bigint) - Timestamp mínimo',
    expectedType: 'bigint'
  },
  
  // Campos timestamp (convierten a ISO string)
  { 
    input: '1744948799', 
    fieldType: 'timestamp', 
    description: 'modified_on (timestamp) - Timestamp futuro válido',
    expectedType: 'ISO string'
  },
  { 
    input: '1686369599', 
    fieldType: 'timestamp', 
    description: 'redcardtime (timestamp) - Timestamp pasado válido',
    expectedType: 'ISO string'
  },
  { 
    input: '0', 
    fieldType: 'timestamp', 
    description: 'modified_on (timestamp) - Timestamp mínimo',
    expectedType: 'ISO string'
  },
  
  // Casos edge
  { 
    input: '1893456001', 
    fieldType: 'bigint', 
    description: 'Timestamp fuera de rango (2030+)',
    expectedType: 'null'
  },
  { 
    input: '-1', 
    fieldType: 'bigint', 
    description: 'Timestamp negativo',
    expectedType: 'null'
  },
  { 
    input: 'abc', 
    fieldType: 'bigint', 
    description: 'String no numérico',
    expectedType: 'null'
  },
  { 
    input: null, 
    fieldType: 'bigint', 
    description: 'Null',
    expectedType: 'null'
  }
];

console.log('📅 Pruebas de Conversión de Timestamps:');
console.log('=' .repeat(70));

testCases.forEach((test, index) => {
  const result = convertTimestamp(test.input, test.fieldType);
  let status = '❌';
  let resultStr = 'null';
  
  if (result !== null) {
    if (test.fieldType === 'bigint' && typeof result === 'number') {
      status = '✅';
      resultStr = `${result} (Unix timestamp)`;
    } else if (test.fieldType === 'timestamp' && typeof result === 'string') {
      status = '✅';
      resultStr = `${result} (ISO string)`;
    }
  } else if (test.expectedType === 'null') {
    status = '✅';
    resultStr = 'null';
  }
  
  console.log(`${index + 1}. ${status} ${test.description}`);
  console.log(`   Input: ${test.input} (${test.fieldType})`);
  console.log(`   Expected: ${test.expectedType}`);
  console.log(`   Output: ${resultStr}`);
  console.log('');
});

console.log('🎯 Resumen de Tipos de Campos en Supabase:');
console.log('=' .repeat(70));

console.log('✅ Campos BIGINT (mantienen Unix timestamp):');
console.log('   • createdate: bigint');
console.log('   • membersince: bigint');
console.log('   • location: bigint');

console.log('\n✅ Campos TIMESTAMP (convierten a ISO string):');
console.log('   • modified_on: timestamp with time zone');
console.log('   • redcardtime: timestamp without time zone');
console.log('   • created_at, updated_at, synced_at: timestamp with time zone');

console.log('\n💡 Beneficios de la Nueva Implementación:');
console.log('   • Campos bigint mantienen formato Unix (más eficiente)');
console.log('   • Campos timestamp usan formato ISO (compatible con Supabase)');
console.log('   • Validación de rangos previene errores de fecha');
console.log('   • Conversión automática según el tipo de campo');

console.log('\n✨ Pruebas completadas!');
