// Script de prueba para validar la función de conversión de timestamps
// Este script simula la lógica de convertTimestamp para probar diferentes valores

console.log('🧪 Probando validación de timestamps...\n');

// Función de conversión de timestamps (copiada del sync)
function convertTimestamp(timestamp) {
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
    
    // Mantener como bigint (timestamp Unix) para Supabase
    return unixTime;
  } catch (error) {
    console.log(`⚠️  Error converting timestamp ${timestamp}:`, error);
    return null;
  }
}

// Función de validación de fecha de licencia
function validateLicenseDate(year, month, day = '01') {
  if (!year || !month) return null;
  
  try {
    // Validar que año, mes y día sean números válidos
    const yearNum = parseInt(year.toString());
    const monthNum = parseInt(month.toString());
    const dayNum = parseInt(day.toString());
    
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) return null;
    
    // Validar rangos razonables
    if (yearNum < 1900 || yearNum > 2030) return null;
    if (monthNum < 1 || monthNum > 12) return null;
    if (dayNum < 1 || dayNum > 31) return null;
    
    // Crear fecha y validar que sea válida
    const dateString = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    const testDate = new Date(dateString);
    
    if (isNaN(testDate.getTime())) return null;
    
    return dateString;
  } catch (error) {
    console.log(`⚠️  Error validando fecha de licencia:`, error);
    return null;
  }
}

// Casos de prueba para timestamps
const timestampTests = [
  { input: '1744948799', description: 'Timestamp futuro válido (2025)' },
  { input: '1762315199', description: 'Timestamp futuro válido (2025)' },
  { input: '1686369599', description: 'Timestamp pasado válido (2023)' },
  { input: '1655006399', description: 'Timestamp pasado válido (2022)' },
  { input: '1710561599', description: 'Timestamp futuro válido (2024)' },
  { input: '0', description: 'Timestamp mínimo (1970)' },
  { input: '1893456000', description: 'Timestamp máximo (2030)' },
  { input: '1893456001', description: 'Timestamp fuera de rango (2030+)' },
  { input: '-1', description: 'Timestamp negativo' },
  { input: 'abc', description: 'String no numérico' },
  { input: '', description: 'String vacío' },
  { input: null, description: 'Null' },
  { input: undefined, description: 'Undefined' },
  { input: '1,234,567', description: 'String con comas' },
];

console.log('📅 Pruebas de Timestamps:');
console.log('=' .repeat(50));

timestampTests.forEach((test, index) => {
  const result = convertTimestamp(test.input);
  const status = result !== null ? '✅' : '❌';
  const resultStr = result !== null ? `${result} (${new Date(result * 1000).toISOString()})` : 'null';
  
  console.log(`${index + 1}. ${status} ${test.description}`);
  console.log(`   Input: ${test.input}`);
  console.log(`   Output: ${resultStr}`);
  console.log('');
});

// Casos de prueba para fechas de licencia
const licenseDateTests = [
  { year: '2025', month: '12', day: '31', description: 'Fecha válida futura' },
  { year: '2020', month: '6', day: '15', description: 'Fecha válida pasada' },
  { year: '1900', month: '1', day: '1', description: 'Fecha mínima válida' },
  { year: '2030', month: '12', day: '31', description: 'Fecha máxima válida' },
  { year: '1899', month: '12', day: '31', description: 'Año muy antiguo' },
  { year: '2031', month: '1', day: '1', description: 'Año muy futuro' },
  { year: '2024', month: '13', day: '1', description: 'Mes inválido' },
  { year: '2024', month: '0', day: '1', description: 'Mes cero' },
  { year: '2024', month: '12', day: '32', description: 'Día inválido' },
  { year: '2024', month: '12', day: '0', description: 'Día cero' },
  { year: 'abc', month: '12', day: '1', description: 'Año no numérico' },
  { year: '2024', month: 'abc', day: '1', description: 'Mes no numérico' },
  { year: '2024', month: '12', day: 'abc', description: 'Día no numérico' },
  { year: null, month: '12', day: '1', description: 'Año null' },
  { year: '2024', month: null, day: '1', description: 'Mes null' },
];

console.log('📋 Pruebas de Fechas de Licencia:');
console.log('=' .repeat(50));

licenseDateTests.forEach((test, index) => {
  const result = validateLicenseDate(test.year, test.month, test.day);
  const status = result !== null ? '✅' : '❌';
  
  console.log(`${index + 1}. ${status} ${test.description}`);
  console.log(`   Input: ${test.year}/${test.month}/${test.day}`);
  console.log(`   Output: ${result || 'null'}`);
  console.log('');
});

console.log('🎯 Resumen de Pruebas:');
console.log('=' .repeat(50));

const timestampValid = timestampTests.filter(test => convertTimestamp(test.input) !== null).length;
const licenseValid = licenseDateTests.filter(test => validateLicenseDate(test.year, test.month, test.day) !== null).length;

console.log(`📅 Timestamps válidos: ${timestampValid}/${timestampTests.length} (${Math.round(timestampValid/timestampTests.length*100)}%)`);
console.log(`📋 Fechas de licencia válidas: ${licenseValid}/${licenseDateTests.length} (${Math.round(licenseValid/licenseDateTests.length*100)}%)`);

console.log('\n✨ Pruebas completadas!');
