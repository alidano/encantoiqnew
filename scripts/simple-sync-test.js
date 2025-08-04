// scripts/simple-sync-test.js
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

async function simpleSync() {
  console.log('🚀 Iniciando sincronización simple...');
  
  const biotrackClient = new Client(biotrackConfig);
  
  try {
    // Conectar a BioTrack
    await biotrackClient.connect();
    console.log('✅ Conectado a BioTrack');

    // Obtener algunos customers de BioTrack
    console.log('📊 Obteniendo customers de BioTrack...');
    const biotrackResult = await biotrackClient.query(`
      SELECT 
        customerid, lastname, firstname, middlename,
        birthmonth, birthday, birthyear,
        phone, email, cell, address1, city, state, zip,
        licensenum, licenseexpmonth, licenseexpyear,
        createdate, modified_on, deleted, location
      FROM customers
      WHERE deleted = 0
      ORDER BY modified_on DESC
      LIMIT 5
    `);

    console.log(`🔍 Encontrados ${biotrackResult.rows.length} customers en BioTrack`);

    // Procesar cada customer
    let insertados = 0;
    let actualizados = 0;
    let errores = 0;

    for (const row of biotrackResult.rows) {
      try {
        console.log(`\n🔄 Procesando: ${row.firstname} ${row.lastname} (${row.customerid})`);

        // Transformar datos
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
          address2: null, // No en el query básico
          city: row.city,
          state: row.state,
          zip: row.zip,
          licensenum: row.licensenum,
          licenseexpmonth: row.licenseexpmonth,
          licenseexpyear: row.licenseexpyear,
          createdate: row.createdate,
          modified_on_bt: row.modified_on,
          deleted: row.deleted,
          location: row.location,
        };

        // Verificar si ya existe
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('customerid')
          .eq('customerid', customerData.customerid)
          .single();

        if (existingCustomer) {
          // Actualizar
          const { error } = await supabase
            .from('customers')
            .update({
              ...customerData,
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            })
            .eq('customerid', customerData.customerid);

          if (error) {
            console.error(`❌ Error actualizando: ${error.message}`);
            errores++;
          } else {
            console.log(`✅ Actualizado exitosamente`);
            actualizados++;
          }
        } else {
          // Insertar
          const { error } = await supabase
            .from('customers')
            .insert({
              ...customerData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              synced_at: new Date().toISOString(),
            });

          if (error) {
            console.error(`❌ Error insertando: ${error.message}`);
            errores++;
          } else {
            console.log(`✅ Insertado exitosamente`);
            insertados++;
          }
        }

      } catch (error) {
        console.error(`💥 Error procesando customer:`, error.message);
        errores++;
      }
    }

    console.log(`\n🎉 RESUMEN:`);
    console.log(`  ➕ Insertados: ${insertados}`);
    console.log(`  🔄 Actualizados: ${actualizados}`);
    console.log(`  ❌ Errores: ${errores}`);

    // Verificar en Supabase
    console.log(`\n🔍 Verificando en Supabase...`);
    const { data: supabaseCustomers, error: supabaseError } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname, synced_at')
      .order('synced_at', { ascending: false })
      .limit(5);

    if (supabaseError) {
      console.error('❌ Error consultando Supabase:', supabaseError);
    } else {
      console.log(`✅ ${supabaseCustomers.length} customers más recientes en Supabase:`);
      supabaseCustomers.forEach((customer, i) => {
        console.log(`  ${i + 1}. ${customer.firstname} ${customer.lastname} (${customer.customerid})`);
      });
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  } finally {
    await biotrackClient.end();
    console.log('🔌 Desconectado de BioTrack');
  }
}

simpleSync().catch(console.error);
