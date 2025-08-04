
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});

async function checkUserClaims() {
  try {
    const user = await admin.auth().getUserByEmail('alidano@gmail.com');
    console.log('=== ADMIN USER CLAIMS ===');
    console.log('UID:', user.uid);
    console.log('Email:', user.email);
    console.log('Custom Claims:', JSON.stringify(user.customClaims, null, 2));
    
    const userRegular = await admin.auth().getUserByEmail('smartinez@encantotree.com');
    console.log('\n=== REGULAR USER CLAIMS ===');
    console.log('UID:', userRegular.uid);
    console.log('Email:', userRegular.email);
    console.log('Custom Claims:', JSON.stringify(userRegular.customClaims, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkUserClaims();
