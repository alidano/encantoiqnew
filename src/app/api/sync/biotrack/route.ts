// src/app/api/sync/biotrack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';
import { getDatabaseConfig, DatabaseConfig } from '@/lib/database-config';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function para manejar errores
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Helper function para verificar si una columna existe
async function columnExists(client: Client, table: string, column: string): Promise<boolean> {
  try {
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 AND column_name = $2
    `, [table, column]);
    return result.rows.length > 0;
  } catch (error) {
    console.warn(`Warning: Could not check if column ${column} exists in ${table}:`, getErrorMessage(error));
    return false;
  }
}

// Helper function para obtener valor seguro de una columna
function getSafeValue(row: any, column: string, fallback: any = null): any {
  return row.hasOwnProperty(column) ? row[column] : fallback;
}

// Función para obtener configuración de BioTrack basada en el ID
function getBioTrackConfig(databaseId: string): {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
} {
  const config = getDatabaseConfig(databaseId);
  if (!config) {
    throw new Error(`Database configuration not found for ID: ${databaseId}`);
  }
  
  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: config.ssl,
  };
}

async function testBioTrackConnection(databaseId: string): Promise<boolean> {
  const biotrackConfig = getBioTrackConfig(databaseId);
  const client = new Client(biotrackConfig);
  try {
    await client.connect();
    const result = await client.query('SELECT 1 as test');
    await client.end();
    return result.rows.length > 0;
  } catch (error) {
    console.error('❌ Test de conexión falló:', error);
    try { await client.end(); } catch {}
    return false;
  }
}

async function getBioTrackTableCounts(databaseId: string): Promise<Record<string, number>> {
  const biotrackConfig = getBioTrackConfig(databaseId);
  const client = new Client(biotrackConfig);
  try {
    await client.connect();
    const tables = ['customers', 'payments', 'products', 'sales', 'locations'];
    const counts: Record<string, number> = {};

    for (const table of tables) {
      try {
        if (table === 'locations') {
          const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
          counts[table] = parseInt(result.rows[0].count);
        } else {
          const result = await client.query(`SELECT COUNT(*) as count FROM ${table} WHERE deleted = 0`);
          counts[table] = parseInt(result.rows[0].count);
        }
      } catch (error) {
        console.error(`Error contando ${table}:`, error);
        counts[table] = 0;
      }
    }

    await client.end();
    return counts;
  } catch (error) {
    console.error('Error obteniendo conteos:', error);
    try { await client.end(); } catch {}
    return {};
  }
}

// Sync locations from BioTrack
async function syncLocations(databaseId: string, limit = 100): Promise<any> {
  const biotrackConfig = getBioTrackConfig(databaseId);
  const client = new Client(biotrackConfig);
  const result = {
    success: false,
    table: 'locations',
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    errors: [] as string[],
    lastSyncTime: new Date(),
  };

  try {
    await client.connect();
    
    const query = `
      SELECT 
        id, name, address1, address2, city, state, zip, phone
      FROM locations
      ORDER BY id
      LIMIT ${limit}
    `;

    console.log('🏥 Sincronizando locations desde BioTrack...');
    const biotrackData = await client.query(query);
    result.recordsProcessed = biotrackData.rows.length;
    console.log(`🏥 Encontradas ${result.recordsProcessed} locations`);

    for (const row of biotrackData.rows) {
      try {
        const locationData = {
          id: row.id,
          name: row.name,
          address1: row.address1,
          address2: row.address2,
          city: row.city,
          state: row.state,
          zip: row.zip,
          phone: row.phone,
        };

        console.log(`🏥 ${locationData.name} (ID: ${locationData.id})`);

        const { data: existingLocation } = await supabase
          .from('locations')
          .select('id')
          .eq('id', locationData.id)
          .single();

        if (existingLocation) {
          const { error } = await supabase
            .from('locations')
            .update({
              ...locationData,
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            })
            .eq('id', locationData.id);

          if (error) {
            result.errors.push(`Error actualizando location ${locationData.id}: ${error.message}`);
          } else {
            result.recordsUpdated++;
          }
        } else {
          const { error } = await supabase
            .from('locations')
            .insert({
              ...locationData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            });

          if (error) {
            result.errors.push(`Error insertando location ${locationData.id}: ${error.message}`);
          } else {
            result.recordsInserted++;
          }
        }
              } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Error procesando location: ${errorMessage}`);
        }
    }

    result.success = result.errors.length === 0;
    await client.end();
    return result;
    
  } catch (error) {
    result.errors.push(`Error general: ${error.message}`);
    try { await client.end(); } catch {}
    return result;
  }
}

async function syncCustomers(databaseId: string, limit = 0): Promise<any> {
  const biotrackConfig = getBioTrackConfig(databaseId);
  const client = new Client(biotrackConfig);
  const result = {
    success: false,
    table: 'customers',
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    errors: [] as string[],
    lastSyncTime: new Date(),
  };

  try {
    await client.connect();
    
    // NUEVO FILTRO: Todos los customers válidos para campañas de renovación
    // - Con licencia que empiece con "PA" (Puerto Rico)
    // - Con fecha de expiración válida
    // - Con al menos teléfono O email
    // - Sin límite de tiempo de inactividad (incluye todos para ofertas de renovación)
    
    console.log(`🔍 Sincronizando TODOS los customers válidos para campañas de renovación:`);
    console.log(`   ✅ Licencias médicas que empiecen con "PA" (Puerto Rico)`);
    console.log(`   ✅ Con fecha de expiración de licencia médica válida`);
    console.log(`   ✅ Con al menos teléfono O email`);
    console.log(`   ✅ Incluye customers inactivos (para ofertas de renovación)`);
    
    // Construir query dinámicamente basado en columnas disponibles
    let query = `
      SELECT 
        customerid, lastname, firstname, middlename,
        birthmonth, birthday, birthyear,
        phone, email, cell, address1, address2, city, state, zip,
        createdate, deleted, location, ismember
    `;
    
    // Verificar columnas opcionales y agregarlas si existen
    const hasModifiedOn = await columnExists(client, 'customers', 'modified_on');
    const hasVisits = await columnExists(client, 'customers', 'visits');
    const hasAmountSpent = await columnExists(client, 'customers', 'amountspent');
    const hasPoints = await columnExists(client, 'customers', 'points');
    const hasDiscount = await columnExists(client, 'customers', 'discount');
    const hasMemberSince = await columnExists(client, 'customers', 'membersince');
    const hasRedCard = await columnExists(client, 'customers', 'redcard');
    const hasRedCardMonth = await columnExists(client, 'customers', 'redcardmonth');
    const hasRedCardDay = await columnExists(client, 'customers', 'redcardday');
    const hasRedCardYear = await columnExists(client, 'customers', 'redcardyear');
    const hasRedCardTime = await columnExists(client, 'customers', 'redcardtime');
    
    if (hasModifiedOn) query += ', modified_on';
    if (hasVisits) query += ', visits';
    if (hasAmountSpent) query += ', amountspent';
    if (hasPoints) query += ', points';
    if (hasDiscount) query += ', discount';
    if (hasMemberSince) query += ', membersince';
    if (hasRedCard) query += ', redcard';
    if (hasRedCardMonth) query += ', redcardmonth';
    if (hasRedCardDay) query += ', redcardday';
    if (hasRedCardYear) query += ', redcardyear';
    if (hasRedCardTime) query += ', redcardtime';
    
    query += `
      FROM customers
      WHERE deleted = 0
    `;
    
    // Solo aplicar filtros de licencia si las columnas existen
    if (hasRedCard) {
      query += `
        AND redcard IS NOT NULL 
        AND redcard != ''
        AND redcard LIKE 'PA%'
      `;
    }
    
    query += `
      AND (phone IS NOT NULL AND phone != '' OR email IS NOT NULL AND email != '')
      ORDER BY customerid
      ${limit > 0 ? `LIMIT ${limit}` : ''}
    `;

    console.log('🔍 Sincronizando customers válidos para campañas de renovación...');
    console.log(`🔍 Query ejecutado:`, query.substring(0, 200) + '...');
    
    const biotrackData = await client.query(query);
    result.recordsProcessed = biotrackData.rows.length;
    console.log(`📊 Encontrados ${result.recordsProcessed} customers válidos para renovación`);
    console.log(`   ✅ Incluye todos los customers con licencia médica PA válida`);
    console.log(`   ✅ Con contacto (teléfono o email) para campañas`);
    console.log(`   ✅ Incluye inactivos para ofertas de renovación`);
    
    if (result.recordsProcessed === 0) {
      console.log(`⚠️  No se encontraron customers que cumplan los criterios`);
      console.log(`🔍 Verificando si hay customers en la base de datos...`);
      
      // Query de prueba para ver cuántos customers hay en total
      const testQuery = `SELECT COUNT(*) as total FROM customers WHERE deleted = 0`;
      const testResult = await client.query(testQuery);
      console.log(`📊 Total de customers activos: ${testResult.rows[0].total}`);
      
      // Query para ver cuántos tienen licencia PA
      const paQuery = `SELECT COUNT(*) as total FROM customers WHERE deleted = 0 AND redcard LIKE 'PA%'`;
      const paResult = await client.query(paQuery);
      console.log(`📊 Customers con licencia PA: ${paResult.rows[0].total}`);
      
      // Query para ver cuántos tienen fecha de expiración de licencia médica
      const expQuery = `SELECT COUNT(*) as total FROM customers WHERE deleted = 0 AND redcardyear IS NOT NULL AND redcardmonth IS NOT NULL`;
      const expResult = await client.query(expQuery);
      console.log(`📊 Customers con fecha de expiración de licencia médica: ${expResult.rows[0].total}`);
      
      // 🔍 NUEVO: Ver ejemplos de licencias para entender el formato
      console.log(`🔍 Verificando formato de licencias...`);
      const licenseQuery = `SELECT DISTINCT redcard FROM customers WHERE deleted = 0 AND redcard IS NOT NULL AND redcard != '' LIMIT 10`;
      const licenseResult = await client.query(licenseQuery);
      console.log(`📋 Ejemplos de licencias encontradas:`);
      licenseResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. "${row.redcard}"`);
      });
      
      // Ver cuántos tienen licencia con cualquier formato
      const anyLicenseQuery = `SELECT COUNT(*) as total FROM customers WHERE deleted = 0 AND redcard IS NOT NULL AND redcard != ''`;
      const anyLicenseResult = await client.query(anyLicenseQuery);
      console.log(`📊 Customers con cualquier licencia: ${anyLicenseResult.rows[0].total}`);
    }

    console.log(`🔄 Procesando ${biotrackData.rows.length} customers...`);
    
    for (const row of biotrackData.rows) {
      try {
        // Convertir timestamps de BioTrack manteniendo formato bigint para Supabase
        const convertTimestamp = (timestamp: any) => {
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
              console.warn(`⚠️ Timestamp fuera de rango válido: ${unixTime} (${new Date(unixTime * 1000).toISOString()})`);
              return null;
            }
            
            // Mantener como bigint (timestamp Unix) para Supabase
            return unixTime;
          } catch (error) {
            console.warn(`⚠️ Error converting timestamp ${timestamp}:`, error);
            return null;
          }
        };

        // Obtener el nombre de ubicación mapeado
        const config = getDatabaseConfig(databaseId);
        const locationName = config?.locationMap?.[row.location?.toString()] || `Location ${row.location}`;
        
        const customerData = {
          customerid: row.customerid,
          lastname: row.lastname,
          firstname: row.firstname,
          middlename: row.middlename,
          birthmonth: row.birthmonth,
          birthday: row.birthday,
          birthyear: row.birthyear,
          phone: row.phone,
          email: row.email,
          cell: row.cell,
          address1: row.address1,
          address2: row.address2,
          city: row.city,
          state: row.state,
          zip: row.zip,
          ismember: row.ismember,
          createdate: convertTimestamp(getSafeValue(row, 'createdate')),
          modified_on_bt: getSafeValue(row, 'modified_on'),
          deleted: row.deleted,
          location: row.location,
          location_name: locationName,
          database_source: config?.name || 'Unknown',
          // Columnas opcionales con valores por defecto
          visits: getSafeValue(row, 'visits', 0),
          amountspent: getSafeValue(row, 'amountspent', 0),
          points: getSafeValue(row, 'points'),
          discount: getSafeValue(row, 'discount'),
          membersince: getSafeValue(row, 'membersince'),
          modified_on: getSafeValue(row, 'modified_on'),
          // Licencia de paciente médica (opcional)
          redcard: getSafeValue(row, 'redcard'),
          redcardmonth: getSafeValue(row, 'redcardmonth'),
          redcardday: getSafeValue(row, 'redcardday'),
          redcardyear: getSafeValue(row, 'redcardyear'),
          redcardtime: convertTimestamp(getSafeValue(row, 'redcardtime')),
          // Calcular fecha de expiración de licencia médica si existe
          license_exp_date: (() => {
            const year = getSafeValue(row, 'redcardyear');
            const month = getSafeValue(row, 'redcardmonth');
            const day = getSafeValue(row, 'redcardday') || '01';
            
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
              console.warn(`⚠️ Error validando fecha de licencia para customer ${row.customerid}:`, error);
              return null;
            }
          })(),
        };

        // Log de la fecha de expiración para debug
        const expDate = customerData.redcardmonth && customerData.redcardyear ? 
          `${customerData.redcardmonth}/${customerData.redcardyear}` : 'No disponible';
        const contactInfo = customerData.phone || customerData.email || 'Sin contacto';
        const licenseInfo = customerData.redcard || 'Sin licencia médica';
        
        // Log adicional para debugging de fechas
        if (customerData.license_exp_date) {
          console.log(`👤 ${customerData.firstname} ${customerData.lastname} - Lic Médica: ${licenseInfo} - Expira: ${expDate} (${customerData.license_exp_date}) - Contacto: ${contactInfo} - Ubicación: ${customerData.location_name}`);
        } else {
          console.log(`👤 ${customerData.firstname} ${customerData.lastname} - Lic Médica: ${licenseInfo} - Expira: ${expDate} (Fecha inválida) - Contacto: ${contactInfo} - Ubicación: ${customerData.location_name}`);
        }

        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('customerid')
          .eq('customerid', customerData.customerid)
          .single();

        if (existingCustomer) {
          const { error } = await supabase
            .from('customers')
            .update({
              ...customerData,
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            })
            .eq('customerid', customerData.customerid);

          if (error) {
            result.errors.push(`Error actualizando ${customerData.customerid}: ${error.message}`);
          } else {
            result.recordsUpdated++;
          }
        } else {
          const { error } = await supabase
            .from('customers')
            .insert({
              ...customerData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            });

          if (error) {
            result.errors.push(`Error insertando ${customerData.customerid}: ${error.message}`);
          } else {
            result.recordsInserted++;
          }
        }
      } catch (error) {
        result.errors.push(`Error procesando customer: ${getErrorMessage(error)}`);
      }
    }

    result.success = result.errors.length === 0;
    
    // Log resumen de errores para debugging
    if (result.errors.length > 0) {
      console.log(`⚠️  Resumen de errores en syncCustomers:`);
      console.log(`   📊 Total de registros procesados: ${result.recordsProcessed}`);
      console.log(`   ✅ Registros insertados: ${result.recordsInserted}`);
      console.log(`   🔄 Registros actualizados: ${result.recordsUpdated}`);
      console.log(`   ❌ Errores: ${result.errors.length}`);
      
      // Mostrar primeros 5 errores como ejemplo
      const errorExamples = result.errors.slice(0, 5);
      console.log(`   🔍 Ejemplos de errores:`);
      errorExamples.forEach((error, index) => {
        console.log(`      ${index + 1}. ${error}`);
      });
      
      if (result.errors.length > 5) {
        console.log(`      ... y ${result.errors.length - 5} errores más`);
      }
    }
    
    await client.end();
    return result;
    
  } catch (error) {
    result.errors.push(`Error general: ${getErrorMessage(error)}`);
    try { await client.end(); } catch {}
    return result;
  }
}

// Sync products from BioTrack
async function syncProducts(databaseId: string, limit = 100): Promise<any> {
  const biotrackConfig = getBioTrackConfig(databaseId);
  const client = new Client(biotrackConfig);
  const result = {
    success: false,
    table: 'products',
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    errors: [] as string[],
    lastSyncTime: new Date(),
  };

  try {
    await client.connect();
    
    // Construir query dinámicamente basado en columnas disponibles
    let query = `
      SELECT 
        id, name, taxcategory, productcategory, applymemberdiscount,
        strain, pricepoint, image, location, deleted
    `;
    
    const hasModifiedOn = await columnExists(client, 'products', 'modified_on');
    if (hasModifiedOn) query += ', modified_on';
    
    query += `
      FROM products
      WHERE deleted = 0
      ORDER BY id
      ${limit > 0 ? `LIMIT ${limit}` : ''}
    `;

    console.log('🛒 Sincronizando products desde BioTrack...');
    const biotrackData = await client.query(query);
    result.recordsProcessed = biotrackData.rows.length;
    console.log(`🛒 Encontrados ${result.recordsProcessed} products`);

    for (const row of biotrackData.rows) {
      try {
        const productData = {
          id: row.id,
          name: row.name,
          taxcategory: row.taxcategory,
          productcategory: row.productcategory,
          applymemberdiscount: row.applymemberdiscount,
          strain: row.strain,
          pricepoint: row.pricepoint?.toString(),
          image: row.image,
          location: row.location,
          modified_on_bt: getSafeValue(row, 'modified_on'),
          deleted: row.deleted,
        };

        console.log(`🛒 ${productData.name} (ID: ${productData.id})`);

        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('id', productData.id)
          .single();

        if (existingProduct) {
          const { error } = await supabase
            .from('products')
            .update({
              ...productData,
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            })
            .eq('id', productData.id);

          if (error) {
            result.errors.push(`Error actualizando product ${productData.id}: ${error.message}`);
          } else {
            result.recordsUpdated++;
          }
        } else {
          const { error } = await supabase
            .from('products')
            .insert({
              ...productData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            });

          if (error) {
            result.errors.push(`Error insertando product ${productData.id}: ${error.message}`);
          } else {
            result.recordsInserted++;
          }
        }
      } catch (error) {
        result.errors.push(`Error procesando product: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
    await client.end();
    return result;
    
  } catch (error) {
    result.errors.push(`Error general: ${error.message}`);
    try { await client.end(); } catch {}
    return result;
  }
}

// Sync sales from BioTrack
async function syncSales(databaseId: string, limit = 100): Promise<any> {
  const biotrackConfig = getBioTrackConfig(databaseId);
  const client = new Client(biotrackConfig);
  const result = {
    success: false,
    table: 'sales',
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    errors: [] as string[],
    lastSyncTime: new Date(),
  };

  try {
    await client.connect();
    
    // ESTRATEGIA INTELIGENTE: 
    // - Full sync: Todo 2024 + 2025 (para comparaciones año sobre año)
    // - Incremental: Solo últimos 30 días (para updates diarios)
    
    let timestampStart;
    let description;
    
    if (limit === 0) { // Full sync
      // Desde 1 enero 2024 hasta ahora (para dashboard comparativo)
      const jan2024 = new Date('2024-01-01');
      timestampStart = Math.floor(jan2024.getTime() / 1000);
      description = 'desde enero 2024 (para comparaciones anuales)';
    } else { // Incremental sync
      // Solo últimos 30 días (para updates regulares)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      timestampStart = Math.floor(thirtyDaysAgo.getTime() / 1000);
      description = 'últimos 30 días (incremental)';
    }
    
    // Construir query dinámicamente basado en columnas disponibles
    let query = `
      SELECT 
        id, ticketid, strain, price, tax, total,
        weighheavy, manualweigh, pricepoint, customerid,
        productid, weight, datetime, location,
        deleted, refunded
    `;
    
    const hasModifiedOn = await columnExists(client, 'sales', 'modified_on');
    const hasInventoryId = await columnExists(client, 'sales', 'inventoryid');
    const hasTerminalId = await columnExists(client, 'sales', 'terminalid');
    const hasTaxCollected = await columnExists(client, 'sales', 'tax_collected');
    const hasIsMedical = await columnExists(client, 'sales', 'is_medical');
    
    if (hasModifiedOn) query += ', modified_on';
    if (hasInventoryId) query += ', inventoryid';
    if (hasTerminalId) query += ', terminalid';
    if (hasTaxCollected) query += ', tax_collected';
    if (hasIsMedical) query += ', is_medical';
    
    query += `
      FROM sales
      WHERE deleted = 0 
        AND datetime > ${timestampStart}
      ORDER BY datetime DESC
      ${limit > 0 ? `LIMIT ${limit}` : ''}
    `;

    console.log(`💰 Sincronizando sales ${description}...`);
    const biotrackData = await client.query(query);
    result.recordsProcessed = biotrackData.rows.length;
    console.log(`💰 Encontradas ${result.recordsProcessed} sales`);
    
    if (limit === 0) {
      console.log(`📊 FULL SYNC: Obteniendo datos desde enero 2024 para dashboard comparativo`);
      console.log(`   ✅ Permitirá comparar 2024 vs 2025`);
      console.log(`   ✅ Permitirá comparar quarters y meses`);
    }

    for (const row of biotrackData.rows) {
      try {
        const saleData = {
          id: row.id,
          ticketid: row.ticketid,
          strain: row.strain,
          price: row.price,
          tax: row.tax,
          total: row.total,
          weighheavy: row.weighheavy,
          manualweigh: row.manualweigh,
          pricepoint: row.pricepoint,
          customerid: row.customerid,
          productid: row.productid,
          weight: row.weight,
          datetime: row.datetime,
          location: row.location,
          deleted: row.deleted,
          refunded: row.refunded,
          modified_on_bt: getSafeValue(row, 'modified_on'),
          // Columnas opcionales para dashboard
          inventoryid: getSafeValue(row, 'inventoryid'),
          terminalid: getSafeValue(row, 'terminalid'),
          tax_collected: getSafeValue(row, 'tax_collected'),
          is_medical: getSafeValue(row, 'is_medical'),
          modified_on: getSafeValue(row, 'modified_on'),
        };

        const saleDate = new Date(row.datetime * 1000).toLocaleDateString();
        console.log(`💰 Sale ${saleData.id} - ${saleData.total} (${saleDate})`);

        const { data: existingSale } = await supabase
          .from('sales')
          .select('id')
          .eq('id', saleData.id)
          .single();

        if (existingSale) {
          const { error } = await supabase
            .from('sales')
            .update({
              ...saleData,
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            })
            .eq('id', saleData.id);

          if (error) {
            result.errors.push(`Error actualizando sale ${saleData.id}: ${error.message}`);
          } else {
            result.recordsUpdated++;
          }
        } else {
          const { error } = await supabase
            .from('sales')
            .insert({
              ...saleData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            });

          if (error) {
            result.errors.push(`Error insertando sale ${saleData.id}: ${error.message}`);
          } else {
            result.recordsInserted++;
          }
        }
      } catch (error) {
        result.errors.push(`Error procesando sale: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
    await client.end();
    return result;
    
  } catch (error) {
    result.errors.push(`Error general: ${error.message}`);
    try { await client.end(); } catch {}
    return result;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { syncType = 'incremental', tables = ['customers'], databaseId = 'encanto-tree-og' } = await request.json();
    
    console.log(`🚀 Iniciando sincronización ${syncType} para tablas:`, tables);
    console.log(`🗄️  Base de datos seleccionada:`, databaseId);
    console.log(`📊 Parámetros recibidos:`, { syncType, tables, databaseId });
    
    const startTime = Date.now();
    
    // Test de conexión primero
    const connectionTest = await testBioTrackConnection(databaseId);
    if (!connectionTest) {
      return NextResponse.json(
        { success: false, error: 'No se pudo conectar a BioTrack' },
        { status: 500 }
      );
    }

    const results = [];

    // Sincronizar locations primero (necesarias para customers)
    if (tables.includes('locations')) {
      results.push(await syncLocations(databaseId, 100));
    }

    // Sincronizar customers
    if (tables.includes('customers')) {
      const limit = syncType === 'full' ? 0 : 100; // 0 = sin límite para full sync
      results.push(await syncCustomers(databaseId, limit));
    }

    // Sincronizar products
    if (tables.includes('products')) {
      const limit = syncType === 'full' ? 0 : 100; // 0 = sin límite para full sync
      results.push(await syncProducts(databaseId, limit));
    }

    // Sincronizar sales
    if (tables.includes('sales')) {
      const limit = syncType === 'full' ? 0 : 100; // 0 = sin límite para datos históricos
      results.push(await syncSales(databaseId, limit));
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const summary = {
      totalRecords: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
      newRecords: results.reduce((sum, r) => sum + r.recordsInserted, 0),
      updatedRecords: results.reduce((sum, r) => sum + r.recordsUpdated, 0),
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
    };

    // Determinar el estado general de la sincronización
    let overallStatus: 'success' | 'partial' | 'failed' = 'success';
    if (summary.errors > 0) {
      overallStatus = summary.errors < summary.totalRecords ? 'partial' : 'failed';
    }

    // Obtener el nombre de la base de datos
    const databaseConfig = getDatabaseConfig(databaseId);
    const databaseName = databaseConfig?.name || databaseId;

    // Guardar historial en la base de datos
    try {
      const { error: historyError } = await supabase
        .from('sync_history')
        .insert({
          database_id: databaseId,
          database_name: databaseName,
          sync_type: syncType,
          tables: tables,
          start_time: new Date(startTime).toISOString(),
          end_time: new Date(endTime).toISOString(),
          duration: duration,
          total_records: summary.totalRecords,
          total_inserted: summary.newRecords,
          total_updated: summary.updatedRecords,
          total_errors: summary.errors,
          status: overallStatus,
          results: results
        });

      if (historyError) {
        console.warn('⚠️ No se pudo guardar el historial:', historyError);
      } else {
        console.log('✅ Historial de sincronización guardado');
      }
    } catch (historyError) {
      console.warn('⚠️ Error guardando historial:', historyError);
    }

    return NextResponse.json({
      success: true,
      results,
      summary,
      syncType,
      tables,
      databaseId,
      duration,
      status: overallStatus
    });

  } catch (error) {
    console.error('❌ Error en API de sincronización:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const databaseId = searchParams.get('databaseId') || 'encanto-tree-og';
    
    console.log('🔍 Probando conexión desde API...');
    console.log('🗄️  Base de datos:', databaseId);
    
    const counts = await getBioTrackTableCounts(databaseId);
    const connectionTest = await testBioTrackConnection(databaseId);
    
    console.log('✅ Conexión:', connectionTest);
    console.log('📊 Conteos:', counts);

    return NextResponse.json({
      success: true,
      connected: connectionTest,
      tableCounts: counts,
      timestamp: new Date().toISOString(),
      databaseId
    });

  } catch (error) {
    console.error('❌ Error en GET:', error);
    return NextResponse.json(
      { success: false, error: error.message, connected: false },
      { status: 500 }
    );
  }
}
