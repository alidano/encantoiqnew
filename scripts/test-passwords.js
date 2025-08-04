// scripts/test-passwords.js
const { Client } = require('pg');
require('dotenv').config();

// Posibles variaciones del password
const passwordVariations = [
  'swfCi2i4R7NSuEe64TD40qYDuud',
  'swfCi2i4R7NSuEe64TD40qYD',
  'swfCf2i4R7NSuEe64TD40qYDuud', // Variación con 'f' en lugar de 'i'
  'swfCi2i4R7NSuEe64TD40qYDuudLocation: Encanto Tree', // Completo
];

const baseConfig = {
  host: '64.89.2.20',
  port: 5432,
  database: 'biotrackthc',
  user: 'egro',
  ssl: false,
};

async function testPasswords() {
  console.log('🔍 Probando diferentes variaciones del password...\n');

  for (let i = 0; i < passwordVariations.length; i++) {
    const password = passwordVariations[i];
    console.log(`🔑 Probando password ${i + 1}: ${password.substring(0, 10)}...`);
    
    const client = new Client({
      ...baseConfig,
      password: password
    });

    try {
      await client.connect();
      console.log('✅ ¡ÉXITO! Este password funciona:', password.substring(0, 15) + '...');
      
      // Test adicional
      const result = await client.query('SELECT COUNT(*) as count FROM customers WHERE deleted = 0');
      console.log(`📊 Customers activos: ${result.rows[0].count}`);
      
      await client.end();
      
      console.log(`\n🎯 USAR ESTE PASSWORD EN .env:`);
      console.log(`BIOTRACK_PASSWORD=${password}`);
      return;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message.substring(0, 50)}...`);
      await client.end().catch(() => {});
    }
    
    console.log('');
  }
  
  console.log('💡 Ningún password funcionó. Verifica con el administrador de la base de datos.');
}

testPasswords().catch(console.error);
