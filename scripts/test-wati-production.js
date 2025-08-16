/**
 * Test WATI API in Production Environment
 * This script tests if WATI environment variables are properly configured
 */

const https = require('https');

// Test the production WATI API endpoints
const PRODUCTION_URL = 'https://encantoiq.virtuososmart.ai';

async function testWatiAPI() {
  console.log('🧪 Testing WATI API in Production Environment');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Check if the page loads
    console.log('\n1️⃣ Testing main page load...');
    await testPageLoad(`${PRODUCTION_URL}/chat/wati`);
    
    // Test 2: Test WATI API endpoint directly
    console.log('\n2️⃣ Testing WATI API endpoint...');
    await testAPIEndpoint(`${PRODUCTION_URL}/api/wati/get-contacts`);
    
    // Test 3: Test with different endpoint
    console.log('\n3️⃣ Testing WATI test endpoint...');
    await testAPIEndpoint(`${PRODUCTION_URL}/api/wati/test`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function testPageLoad(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, res.headers);
      
      if (res.statusCode === 200) {
        console.log('   ✅ Page loads successfully');
      } else {
        console.log(`   ⚠️ Page returned status ${res.statusCode}`);
      }
      
      resolve();
    });
    
    req.on('error', (error) => {
      console.error('   ❌ Error loading page:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function testAPIEndpoint(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data.substring(0, 200)}...`);
        
        if (res.statusCode === 500) {
          console.log('   ❌ Server error - likely environment variables not loaded');
        } else if (res.statusCode === 200) {
          console.log('   ✅ API endpoint working');
        } else {
          console.log(`   ⚠️ Unexpected status: ${res.statusCode}`);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('   ❌ Error calling API:', error.message);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testWatiAPI().then(() => {
  console.log('\n🎯 Test completed. Check results above.');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed:', error);
  process.exit(1);
});
