// Debug script para verificar el problema con los IDs de pacientes
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (ajustar según sea necesario)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPatientIds() {
  console.log('🔍 Debugging Patient IDs...\n');
  
  try {
    // 1. Obtener algunos registros sample para ver los customerid
    console.log('1. Sample customers with their customerid values:');
    const { data: sampleCustomers, error: sampleError } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname, deleted')
      .eq('deleted', 0)
      .limit(10);
    
    if (sampleError) {
      console.error('Error getting sample customers:', sampleError);
    } else {
      sampleCustomers.forEach(customer => {
        console.log(`   ID: ${customer.customerid} (type: ${typeof customer.customerid}) - ${customer.firstname} ${customer.lastname}`);
      });
    }
    
    console.log('\n2. Looking for specific IDs 13, 26, 58:');
    
    // 2. Buscar específicamente los IDs que fallan
    const idsToTest = [13, 58, 26];
    
    for (const id of idsToTest) {
      // Buscar como número
      const { data: byNumber, error: numberError } = await supabase
        .from('customers')
        .select('customerid, firstname, lastname')
        .eq('customerid', id)
        .eq('deleted', 0)
        .limit(1);
      
      // Buscar como string
      const { data: byString, error: stringError } = await supabase
        .from('customers')
        .select('customerid, firstname, lastname')
        .eq('customerid', id.toString())
        .eq('deleted', 0)
        .limit(1);
      
      console.log(`   ID ${id}:`);
      console.log(`     As number: ${byNumber?.length || 0} found`);
      console.log(`     As string: ${byString?.length || 0} found`);
      
      if (byNumber && byNumber.length > 0) {
        console.log(`     Found as number: ${byNumber[0].firstname} ${byNumber[0].lastname}`);
      }
      if (byString && byString.length > 0) {
        console.log(`     Found as string: ${byString[0].firstname} ${byString[0].lastname}`);
      }
    }
    
    // 3. Verificar si hay customerid numéricos pequeños
    console.log('\n3. Customers with numeric customerid < 100:');
    const { data: smallIds, error: smallIdsError } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname')
      .eq('deleted', 0)
      .lt('customerid', 100)
      .limit(20);
    
    if (smallIdsError) {
      console.error('Error getting small IDs:', smallIdsError);
    } else {
      console.log(`   Found ${smallIds?.length || 0} customers with ID < 100`);
      smallIds?.forEach(customer => {
        console.log(`     ${customer.customerid}: ${customer.firstname} ${customer.lastname}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Error during debug:', error);
  }
}

debugPatientIds();
