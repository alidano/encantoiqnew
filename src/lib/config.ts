export const config = {
  biotrack: {
    database1: {
      host: process.env.BIOTRACK_HOST_1 || '',
      user: process.env.BIOTRACK_USER_1 || '',
      password: process.env.BIOTRACK_PASSWORD_1 || '',
      port: parseInt(process.env.BIOTRACK_PORT_1 || '5432'),
      database: process.env.BIOTRACK_DATABASE_1 || 'biotrackthc'
    },
    database2: {
      host: process.env.BIOTRACK_HOST_2 || '',
      user: process.env.BIOTRACK_USER_2 || '',
      password: process.env.BIOTRACK_PASSWORD_2 || '',
      port: parseInt(process.env.BIOTRACK_PORT_2 || '5432'),
      database: process.env.BIOTRACK_DATABASE_2 || 'biotrackthc'
    },
    database3: {
      host: process.env.BIOTRACK_HOST_3 || '',
      user: process.env.BIOTRACK_USER_3 || '',
      password: process.env.BIOTRACK_PASSWORD_3 || '',
      port: parseInt(process.env.BIOTRACK_PORT_3 || '5432'),
      database: process.env.BIOTRACK_DATABASE_3 || 'biotrackthc'
    }
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  wati: {
    apiEndpoint: process.env.WATI_API_ENDPOINT || '',
    authToken: process.env.WATI_AUTH_TOKEN || ''
  }
};

// Helper function to check if all required configs are present
export function isConfigValid(): boolean {
  const { biotrack, supabase } = config;
  
  // Check if at least one BioTrack database is configured
  const hasValidBiotrack = [biotrack.database1, biotrack.database2, biotrack.database3].some(db => 
    db.host && db.user && db.password
  );
  
  // Check if Supabase is configured
  const hasValidSupabase = supabase.url && supabase.serviceRoleKey;
  
  return hasValidBiotrack && hasValidSupabase;
}

// Helper function to get database config by ID
export function getBiotrackConfig(id: string) {
  switch (id) {
    case 'encanto-tree-og':
      return biotrack.database1;
    case 'botanik-la-muda':
      return biotrack.database2;
    case 'new-encanto':
      return biotrack.database3;
    default:
      return null;
  }
}
