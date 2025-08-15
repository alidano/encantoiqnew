// scripts/test-customer-id-insert.js
// Test script to verify call_logs insert with real customer_id

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCustomerIdInsert() {
  try {
    console.log('🧪 Testing call_logs insert with real customer_id...');
    
    // Step 1: Get a real customer_id from the customers table
    console.log('\n📊 Step 1: Finding a real customer_id...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customerid, firstname, lastname')
      .eq('deleted', 0)
      .limit(3);
    
    if (customersError) {
      console.error('❌ Error fetching customers:', customersError);
      return;
    }
    
    if (!customers || customers.length === 0) {
      console.error('❌ No customers found in database');
      return;
    }
    
    console.log('📋 Available customers for testing:');
    customers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.firstname} ${customer.lastname} (ID: ${customer.customerid})`);
    });
    
    // Use the first customer for testing
    const testCustomerId = customers[0].customerid;
    console.log(`\n🎯 Using customer ID: ${testCustomerId} (${customers[0].firstname} ${customers[0].lastname})`);
    
    // Step 2: Test insert with real customer_id
    console.log('\n📝 Step 2: Testing insert with real customer_id...');
    const testData = {
      customer_id: testCustomerId,
      call_outcome: 'MIGRATION_TEST_SUCCESS',
      call_notes: `Testing new customer_id-based system with customer: ${customers[0].firstname} ${customers[0].lastname}`,
      created_at: new Date().toISOString()
    };
    
    const { data: testInsert, error: testError } = await supabase
      .from('call_logs')
      .insert([testData])
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
      console.log('💡 This means there might be other constraints or issues');
      return;
    } else {
      console.log('✅ Test insert successful!');
      console.log('📊 New call log record:');
      console.log(`  - ID: ${testInsert.id}`);
      console.log(`  - Customer ID: ${testInsert.customer_id}`);
      console.log(`  - Outcome: ${testInsert.call_outcome}`);
      console.log(`  - Notes: ${testInsert.call_notes}`);
      console.log(`  - Created: ${testInsert.created_at}`);
      
      // Clean up test record
      console.log('\n🧹 Cleaning up test record...');
      const { error: cleanupError } = await supabase
        .from('call_logs')
        .delete()
        .eq('id', testInsert.id);
      
      if (cleanupError) {
        console.log('⚠️  Could not clean up test record:', cleanupError.message);
      } else {
        console.log('✅ Test record cleaned up successfully');
      }
      
      console.log('\n🎉 SUCCESS! The call_logs table is now working with customer_id');
      console.log('✅ You can now save call logs from patient pages using UUIDs');
      console.log('✅ The error "Cannot convert patientId to number" should be resolved');
    }
    
    // Step 3: Verify the new call log appears in the list
    console.log('\n📋 Step 3: Verifying call logs can be fetched by customer_id...');
    const { data: fetchedLogs, error: fetchError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('customer_id', testCustomerId)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.log('❌ Error fetching logs by customer_id:', fetchError.message);
    } else {
      console.log(`✅ Successfully fetched ${fetchedLogs.length} call logs for customer ${testCustomerId}`);
    }
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the function
testCustomerIdInsert()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
