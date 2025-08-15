// scripts/migrate-call-logs-to-customer-id.js
// Migration script to update call_logs table for UUID-based customer system

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

async function migrateCallLogsToCustomerId() {
  try {
    console.log('🚀 Starting call_logs migration to customer_id system...');
    
    // Step 1: Check current state
    console.log('\n📊 Step 1: Checking current state...');
    const { data: currentLogs, error: currentError } = await supabase
      .from('call_logs')
      .select('id, patient_id, customer_id, call_outcome')
      .limit(5);
    
    if (currentError) {
      console.error('❌ Error checking current logs:', currentError);
      return;
    }
    
    console.log('📋 Current call logs sample:');
    currentLogs.forEach(log => {
      console.log(`  - ID: ${log.id}, patient_id: ${log.patient_id}, customer_id: ${log.customer_id || 'NULL'}`);
    });
    
    // Step 2: Make patient_id nullable (this requires manual SQL in Supabase)
    console.log('\n⚠️  Step 2: Database schema update required');
    console.log('💡 You need to run this SQL manually in your Supabase SQL Editor:');
    console.log('');
    console.log('-- Make patient_id nullable');
    console.log('ALTER TABLE call_logs ALTER COLUMN patient_id DROP NOT NULL;');
    console.log('');
    console.log('-- Add index on customer_id for better performance');
    console.log('CREATE INDEX IF NOT EXISTS idx_call_logs_customer_id ON call_logs(customer_id);');
    console.log('');
    console.log('-- Add constraint to ensure either patient_id OR customer_id is provided');
    console.log('ALTER TABLE call_logs ADD CONSTRAINT check_patient_or_customer CHECK (patient_id IS NOT NULL OR customer_id IS NOT NULL);');
    console.log('');
    
    // Step 3: Test the new structure after manual migration
    console.log('🔄 Step 3: Testing new structure (run after manual SQL)...');
    console.log('Press Enter after running the SQL above, or Ctrl+C to exit...');
    
    // Wait for user input (this won't work in automated scripts, but gives instructions)
    await new Promise(resolve => {
      console.log('⏳ Waiting for manual SQL execution...');
      setTimeout(resolve, 5000); // Give 5 seconds for user to read
    });
    
    // Step 4: Test insert with customer_id only
    console.log('\n🧪 Step 4: Testing insert with customer_id only...');
    const testData = {
      customer_id: 'test-migration',
      call_outcome: 'MIGRATION_TEST',
      call_notes: 'Testing new customer_id-based system',
      created_at: new Date().toISOString()
    };
    
    const { data: testInsert, error: testError } = await supabase
      .from('call_logs')
      .insert([testData])
      .select()
      .single();
    
    if (testError) {
      console.log('❌ Test insert failed:', testError.message);
      console.log('💡 This means the manual SQL migration is not complete yet');
      console.log('🔄 Please run the SQL commands above and try again');
    } else {
      console.log('✅ Test insert successful! New record ID:', testInsert.id);
      
      // Clean up test record
      const { error: cleanupError } = await supabase
        .from('call_logs')
        .delete()
        .eq('id', testInsert.id);
      
      if (cleanupError) {
        console.log('⚠️  Could not clean up test record:', cleanupError.message);
      } else {
        console.log('🧹 Test record cleaned up');
      }
      
      console.log('\n🎉 Migration test successful!');
      console.log('✅ The call_logs table now supports customer_id-based operations');
    }
    
    console.log('\n✅ Migration script completed');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the function
migrateCallLogsToCustomerId()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
