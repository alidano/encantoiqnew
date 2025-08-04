// src/app/api/sync/biotrack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuración de BioTrack
const biotrackConfig = {
  host: process.env.BIOTRACK_HOST || '64.89.2.20',
  port: parseInt(process.env.BIOTRACK_PORT || '5432'),
  database: process.env.BIOTRACK_DATABASE || 'biotrackthc',
  user: process.env.BIOTRACK_USER || 'egro',
  password: process.env.BIOTRACK_PASSWORD || 'swfCi2i4R7NSuEe64TD40qYDuud',
  ssl: false,
};

async function testBioTrackConnection(): Promise<boolean> {
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

async function getBioTrackTableCounts(): Promise<Record<string, number>> {
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
async function syncLocations(limit = 100): Promise<any> {
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
        result.errors.push(`Error procesando location: ${error.message}`);
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

async function syncCustomers(limit = 100): Promise<any> {
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
    
    // FILTRO INTELIGENTE: Solo customers con licencias que expiran en ventana de 12 meses
    // (6 meses pasados + 6 meses futuros para automatizaciones y llamadas)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    const pastYear = sixMonthsAgo.getFullYear();
    const pastMonth = sixMonthsAgo.getMonth() + 1;
    const futureYear = sixMonthsFromNow.getFullYear();
    const futureMonth = sixMonthsFromNow.getMonth() + 1;
    
    console.log(`📅 Sincronizando customers con ventana de 12 meses:`);
    console.log(`   Desde: ${pastMonth}/${pastYear} (6 meses atrás)`);
    console.log(`   Hasta: ${futureMonth}/${futureYear} (6 meses adelante)`);
    
    const query = `
      SELECT 
        customerid, lastname, firstname, middlename,
        birthmonth, birthday, birthyear,
        phone, email, cell, address1, address2, city, state, zip,
        licensenum, licenseexpmonth, licenseexpyear,
        createdate, modified_on, deleted, location, ismember,
        visits, amountspent, points, discount, membersince
      FROM customers
      WHERE deleted = 0 
        AND licenseexpyear IS NOT NULL 
        AND licenseexpmonth IS NOT NULL
        AND licenseexpyear != ''
        AND licenseexpmonth != ''
        AND CAST(licenseexpyear AS INTEGER) > 1900
        AND CAST(licenseexpmonth AS INTEGER) BETWEEN 1 AND 12
        AND (
          -- 6 meses pasados: desde pastYear/pastMonth hasta hoy
          (CAST(licenseexpyear AS INTEGER) = ${pastYear} AND CAST(licenseexpmonth AS INTEGER) >= ${pastMonth})
          OR
          (CAST(licenseexpyear AS INTEGER) > ${pastYear} AND CAST(licenseexpyear AS INTEGER) < ${futureYear})
          OR
          -- 6 meses futuros: desde hoy hasta futureYear/futureMonth  
          (CAST(licenseexpyear AS INTEGER) = ${futureYear} AND CAST(licenseexpmonth AS INTEGER) <= ${futureMonth})
        )
      ORDER BY CAST(licenseexpyear AS INTEGER), CAST(licenseexpmonth AS INTEGER)
      LIMIT ${limit}
    `;

    console.log('🔍 Sincronizando customers en ventana de 12 meses (6 pasados + 6 futuros)...');
    const biotrackData = await client.query(query);
    result.recordsProcessed = biotrackData.rows.length;
    console.log(`📊 Encontrados ${result.recordsProcessed} customers en ventana de renovación`);
    console.log(`   ✅ Incluye expirados (para follow-up) y próximos (para preventivo)`);
    console.log(`   ❌ Excluye customers sin fechas de expiración (no útiles para renovaciones)`);

    for (const row of biotrackData.rows) {
      try {
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
          licensenum: row.licensenum,
          licenseexpmonth: row.licenseexpmonth,
          licenseexpyear: row.licenseexpyear,
          createdate: row.createdate,
          modified_on_bt: row.modified_on,
          deleted: row.deleted,
          location: row.location,
          // Columnas nuevas esenciales
          visits: row.visits || 0,
          amountspent: row.amountspent || 0,
          points: row.points,
          discount: row.discount,
          membersince: row.membersince,
          modified_on: row.modified_on,
        };

        // Log de la fecha de expiración para debug
        const expDate = `${customerData.licenseexpmonth}/${customerData.licenseexpyear}`;
        console.log(`👤 ${customerData.firstname} ${customerData.lastname} - Expira: ${expDate} - Visits: ${customerData.visits} - Spent: ${customerData.amountspent}`);

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
        result.errors.push(`Error procesando customer: ${error.message}`);
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

// Sync products from BioTrack
async function syncProducts(limit = 100): Promise<any> {
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
    
    const query = `
      SELECT 
        id, name, taxcategory, productcategory, applymemberdiscount,
        strain, pricepoint, image, location, deleted, modified_on
      FROM products
      WHERE deleted = 0
      ORDER BY modified_on DESC
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
          modified_on_bt: row.modified_on, // ✅ Ahora sí existe la columna
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
async function syncSales(limit = 100): Promise<any> {
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
    
    const query = `
      SELECT 
        id, ticketid, strain, price, tax, total,
        weighheavy, manualweigh, pricepoint, customerid,
        productid, weight, datetime, location,
        deleted, refunded, modified_on,
        inventoryid, terminalid, tax_collected, is_medical
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
          modified_on_bt: row.modified_on,
          // Columnas nuevas esenciales para dashboard
          inventoryid: row.inventoryid,
          terminalid: row.terminalid,
          tax_collected: row.tax_collected,
          is_medical: row.is_medical,
          modified_on: row.modified_on,
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
    const { syncType = 'incremental', tables = ['customers'] } = await request.json();
    
    console.log(`🚀 Iniciando sincronización ${syncType} para tablas:`, tables);
    
    // Test de conexión primero
    const connectionTest = await testBioTrackConnection();
    if (!connectionTest) {
      return NextResponse.json(
        { success: false, error: 'No se pudo conectar a BioTrack' },
        { status: 500 }
      );
    }

    const results = [];

    // Sincronizar locations primero (necesarias para customers)
    if (tables.includes('locations')) {
      results.push(await syncLocations(100));
    }

    // Sincronizar customers
    if (tables.includes('customers')) {
      const limit = syncType === 'full' ? 1000 : 100;
      results.push(await syncCustomers(limit));
    }

    // Sincronizar products
    if (tables.includes('products')) {
      const limit = syncType === 'full' ? 0 : 100; // 0 = sin límite para full sync
      results.push(await syncProducts(limit));
    }

    // Sincronizar sales
    if (tables.includes('sales')) {
      const limit = syncType === 'full' ? 0 : 100; // 0 = sin límite para datos históricos
      results.push(await syncSales(limit));
    }

    const summary = {
      totalRecords: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
      newRecords: results.reduce((sum, r) => sum + r.recordsInserted, 0),
      updatedRecords: results.reduce((sum, r) => sum + r.recordsUpdated, 0),
      errors: results.reduce((sum, r) => sum + r.errors.length, 0),
    };

    return NextResponse.json({
      success: true,
      results,
      summary,
      syncType,
      tables
    });

  } catch (error) {
    console.error('❌ Error en API de sincronización:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('🔍 Probando conexión desde API...');
    const counts = await getBioTrackTableCounts();
    const connectionTest = await testBioTrackConnection();
    
    console.log('✅ Conexión:', connectionTest);
    console.log('📊 Conteos:', counts);

    return NextResponse.json({
      success: true,
      connected: connectionTest,
      tableCounts: counts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en GET:', error);
    return NextResponse.json(
      { success: false, error: error.message, connected: false },
      { status: 500 }
    );
  }
}
