
const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config({ path: '.env' });

// List of UIDs to set as admin (from your Firebase Auth console)
const adminUIDs = [
  'TTBNuPEvjLONI7SBRVKLX73QXrr2', // alidano@gmail.com
  'JF3YDqRbdBfgf39QkFJi19RbYr53', // luis@lofagroup.com (corrected UID)
  'sBSZeFPayOZHCI9PgcsmlbPXvp72'  // emaria@encantotree.com
];

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});

async function setAdminClaims() {
  console.log('Setting admin claims...');
  for (const uid of adminUIDs) {
    try {
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      console.log(`✅ Admin claim set for user: ${uid}`);
      
      // Verify the claim was set
      const user = await admin.auth().getUser(uid);
      console.log(`   Email: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error setting admin claim for ${uid}:`, error.message);
    }
  }
  console.log('Done!');
  process.exit(0);
}

setAdminClaims();
