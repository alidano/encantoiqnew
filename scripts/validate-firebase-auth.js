/**
 * Firebase Authentication Validation Script
 * Validates connection to Firebase and lists users
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: "meditrack-crm-chj0n",
  private_key_id: "your_private_key_id",
  private_key: process.env.FIREBASE_PRIVATE_KEY ? 
    process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : 
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC4Gvhjea4dyFMI\n12nHwyKqmWF5OKUGYbso/xcJIAwknCKU7AHBSxKJqM1L0li0geElLGPwBRGq0D/u\nZ48WZOMvj6jIppz+Aei6PriqnJ0k9xzY5b4w5EsWAaqoYZ8Yxfc8O+0FWC/O3aR9\nN26Qw4gs3pK0L7/YVHeYJRjNexTK6Ecs+ErV6FNNuD7MWopy81ZJwZdMRGxEkLJT\n6mw9UUbqJa6Y3vF6iXsCLw+G3Bo+cWaS+DoXtzCEueBfWzqO2M3TKhRwWIzBAM3C\nTOK/5I2OCYXyMI7lgBCkVLjE/tWSJL/Q4nbYd8+eXxS+W/U15QGbjhnBr1XUyakw\nakuiigynAgMBAAECggEAOy/IfMpolICLWUNPaX4tTeUjdgIk44lVzxc7A57+6GId\np/y7j7WfzwuqfF6yT82VYQsFUet/Q4fRlcZLNOrYMrkfjOorfGmGtSFm4sqYpoKf\nDofFfhhWn0uH3rwLlr5F/mJRj69LJ1kQAYVpkTabN7mSNkVHireU/x+l+qFADP7V\nO75Hy/QdtmKyKVr/ofN5JWB1AR5xvnlH9Pm8lNG5WVH64C8jntDQxYt7eMzfKzS1\nji2SwcernU0XTmOye9Grwf0OoNUxzHELeVj7kbArv6Nwifoz4CjvA6GBBAfj42cS\n5f7vd72yGo7qQnBYB3071BXvm5F18Y8yIKsJ4keqgQKBgQDyXPVjzDGmlrHskrnf\nqRsVQnamSOma14ozeIfikdZzDWbXaYV4wQXDnwbJF2sI93DYweCzGU2+IRLMV0Xl\nOhXtYhPQSnQXevKbswsYItHnAI/l3A2KVAitECqkrlAZcN1KPHBeSQXltUVgSLkX\n09+35CBh83z0Vr/DpC0i1hBswQKBgQDCdttCxZMHbMSIDSqyk9vJ5OY7qLsA5iqE\nReNjOxuW6iGiY4kzijs+SmEXRo0Gus+BTZW8ZCSum5XRLGOe8e1AN29Sf8jLt5R4\n6rb473sm9kV1+tA2r1KVNPh79QnwG0Pb7FIMnsoE7iehtPg9s82GdAhG2QjFZ/Wb\n6sfEI8ILZwKBgQC047C7BaJhJcQyP+i/CCYQngSUY4MHcKvTcrho4FRglrYVPMrD\nr70vnjegSvw2Owhcn4en5NDjgSfYn6KpTcsj27nSEl/HTppYny8+mm5zrTW5Z54r\nikDXemN5eiiKdHSVfbqYhIQESGE5Vc3f/ODTDU8mDGdMrpp92MFfaMnlgQKBgAS9\n3S7Nnn4p2sjueUINdOiBWlPOE3E8K4E6Kwc6Y7vUTaml/6xwDG3CZoeowruNRo4C\nlEoZrwNK6+ZDzNINWBmewGokj4LYIRipsHh1bm1Ox/bOfNE4iSz2M7DiErH2GDt+\nkamZHZftLq40uXDXt4U1wxXnKN2XYVfB68kOjia1AoGBAKTKb0CjcMBnO3xMJimb\n5tAqC0cnWXW3O2eURgARw93HNbgkVjRAcMO4XbR8cBIfYFg49hGdqhbhYuNJhMXo\nE8d6FoJPg8ocuR7D4dyhQTRLO03Xa3FerWP64NN8IBe5FSycdbrTtlADCva102DP\nwoLRDxmWgIhVB9JGwYc4Fqwh\n-----END PRIVATE KEY-----",
  client_email: "firebase-adminsdk-fbsvc@meditrack-crm-chj0n.iam.gserviceaccount.com",
  client_id: "1040948736058",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40meditrack-crm-chj0n.iam.gserviceaccount.com"
};

try {
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "meditrack-crm-chj0n"
  });

  console.log('✅ Firebase Admin SDK initialized successfully');
  
  // Test connection by listing users
  async function listUsers() {
    try {
      console.log('\n🔍 Fetching users from Firebase Authentication...');
      
      const listUsersResult = await admin.auth().listUsers();
      
      console.log(`\n📊 Total users found: ${listUsersResult.users.length}`);
      console.log('\n👥 Users list:');
      console.log('='.repeat(80));
      
      listUsersResult.users.forEach((userRecord, index) => {
        console.log(`${index + 1}. ${userRecord.email || 'No email'} (${userRecord.uid})`);
        console.log(`   Created: ${userRecord.metadata.creationTime}`);
        console.log(`   Last Sign In: ${userRecord.metadata.lastSignInTime || 'Never'}`);
        console.log(`   Disabled: ${userRecord.disabled ? 'Yes' : 'No'}`);
        console.log(`   Email Verified: ${userRecord.emailVerified ? 'Yes' : 'No'}`);
        console.log('   ' + '-'.repeat(40));
      });
      
      // Check specific users from your list
      const expectedUsers = [
        'emaria@encantotree.com',
        'jvelasco@encantotree.com',
        'smartinez@encantotree.com',
        'fquintero@encantotree.com',
        'test@gmail.com',
        'luis@lofagroup.com',
        'alidano@gmail.com'
      ];
      
      console.log('\n🔍 Checking expected users:');
      expectedUsers.forEach(email => {
        const found = listUsersResult.users.find(u => u.email === email);
        if (found) {
          console.log(`✅ ${email} - Found (${found.uid})`);
        } else {
          console.log(`❌ ${email} - Not found`);
        }
      });
      
    } catch (error) {
      console.error('❌ Error listing users:', error.message);
    }
  }
  
  // Test authentication
  async function testAuthentication() {
    try {
      console.log('\n🧪 Testing authentication...');
      
      // Try to create a custom token (this tests admin SDK permissions)
      const customToken = await admin.auth().createCustomToken('test-user-id');
      console.log('✅ Custom token creation successful');
      console.log(`   Token: ${customToken.substring(0, 50)}...`);
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error.message);
    }
  }
  
  // Run tests
  listUsers().then(() => {
    return testAuthentication();
  }).then(() => {
    console.log('\n🎉 Firebase validation completed!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Validation failed:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  process.exit(1);
}
