// setup-user-roles.js
const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Define users with their roles
const users = {
  // Admin users - access to all pages
  admins: [
    { uid: 'sBSZeFPayOZHCI9PgcsmlbPXvp72', email: 'emaria@encantotree.com' },
    { uid: 'JF3YDqRbdBfgf39QkFJi19RbYr53', email: 'luis@lofagroup.com' },
    { uid: 'TTBNuPEvjLONI7SBRVKLX73QXrr2', email: 'alidano@gmail.com' }
  ],
  
  // Regular users - limited access (Dashboard, Patients, Submissions, Chat Inbox)
  regular: [
    { uid: 'zH9tl4oteOXTUn7DnRd7HY97HHQ2', email: 'fquintero@encantotree.com' },
    { uid: 'DDmmVwKqa6RD3Ukh5kexkAGRdy52', email: 'smartinez@encantotree.com' },
    { uid: 'UnqpXwXhabgEnlLK0NjXehDuYnC2', email: 'jvelasco@encantotree.com' }
  ]
};

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});

async function setupUserRoles() {
  console.log('Setting up user roles...\n');

  // Set admin claims
  console.log('🔧 Setting up ADMIN users:');
  for (const user of users.admins) {
    try {
      await admin.auth().setCustomUserClaims(user.uid, { 
        admin: true,
        role: 'admin',
        permissions: ['dashboard', 'patients', 'submissions', 'chat', 'reports', 'settings', 'admin'] 
      });
      console.log(`✅ Admin role set for: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error setting admin role for ${user.email}:`, error.message);
    }
  }

  console.log('\n🔧 Setting up REGULAR users:');
  // Set regular user claims
  for (const user of users.regular) {
    try {
      await admin.auth().setCustomUserClaims(user.uid, { 
        admin: false,
        role: 'user',
 permissions: ['dashboard', 'patients', '/admin/submissions', 'chat'] 
      });
      console.log(`✅ Regular user role set for: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error setting regular role for ${user.email}:`, error.message);
    }
  }

  console.log('\n✨ User roles setup complete!');
  console.log('\nNext steps:');
  console.log('1. Users need to refresh their tokens (logout/login)');
  console.log('2. Update your navigation/routing to check user permissions');
  
  process.exit(0);
}

setupUserRoles();
