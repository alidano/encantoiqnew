// scripts/check-call-logs-schema.js
// Script to check and update call_logs table schema

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

async function checkAndUpdateCallLogsSchema() {
  try {
    console.log('🔍 Checking call_logs table structure...');
    
    // Try to insert a test record with customer_id to see if the column exists
    const testData = {
      customer_id: 'test-check',
      call_outcome: 'TEST_SCHEMA_CHECK',
      call_notes: 'This is a test record to check schema',
      created_at: new Date().toISOString()
    };
    
    console.log('📝 Testing insert with customer_id...');
    const { data: insertResult, error: insertError } = await supabase
      .from('call_logs')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      if (insertError.code === '42703') {
        // Column doesn't exist
        console.log('⚠️  customer_id column not found. Error:', insertError.message);
        console.log('🔄 This means the column needs to be added to the database');
        console.log('💡 You may need to run this SQL manually in your Supabase dashboard:');
        console.log('   ALTER TABLE call_logs ADD COLUMN customer_id VARCHAR;');
        console.log('   CREATE INDEX idx_call_logs_customer_id ON call_logs(customer_id);');
      } else {
        console.error('❌ Other error during test insert:', insertError);
      }
    } else {
      console.log('✅ customer_id column exists and is working');
      console.log('📊 Test record created:', insertResult.id);
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('call_logs')
        .delete()
        .eq('id', insertResult.id);
      
      if (deleteError) {
        console.log('⚠️  Could not clean up test record:', deleteError.message);
      } else {
        console.log('🧹 Test record cleaned up');
      }
    }
    
    // Check existing call logs structure
    console.log('\n📊 Checking existing call logs structure...');
    const { data: existingLogs, error: logsError } = await supabase
      .from('call_logs')
      .select('*')
      .limit(3);
    
    if (logsError) {
      console.error('❌ Error checking existing logs:', logsError);
    } else {
      console.log('📋 Sample existing call logs structure:');
      existingLogs.forEach((log, index) => {
        console.log(`  Record ${index + 1}:`);
        Object.keys(log).forEach(key => {
          console.log(`    ${key}: ${log[key]} (${typeof log[key]})`);
        });
        console.log('');
      });
    }
    
    console.log('\n✅ Schema check completed');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the function
checkAndUpdateCallLogsSchema()
  .then(() => {
    console.log('\n🏁 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
