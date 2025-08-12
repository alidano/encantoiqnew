import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar TODAS las variables de entorno
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      
      // BioTrack Database 1
      BIOTRACK_HOST_1: process.env.BIOTRACK_HOST_1,
      BIOTRACK_USER_1: process.env.BIOTRACK_USER_1,
      BIOTRACK_PASSWORD_1: process.env.BIOTRACK_PASSWORD_1 ? 'EXISTS' : 'MISSING',
      BIOTRACK_PORT_1: process.env.BIOTRACK_PORT_1,
      BIOTRACK_DATABASE_1: process.env.BIOTRACK_DATABASE_1,
      
      // BioTrack Database 2
      BIOTRACK_HOST_2: process.env.BIOTRACK_HOST_2,
      BIOTRACK_USER_2: process.env.BIOTRACK_USER_2,
      BIOTRACK_PASSWORD_2: process.env.BIOTRACK_PASSWORD_2 ? 'EXISTS' : 'MISSING',
      
      // BioTrack Database 3
      BIOTRACK_HOST_3: process.env.BIOTRACK_HOST_3,
      BIOTRACK_USER_3: process.env.BIOTRACK_USER_3,
      BIOTRACK_PASSWORD_3: process.env.BIOTRACK_PASSWORD_3 ? 'EXISTS' : 'MISSING',
      
      // Supabase
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING',
      
      // Otras variables importantes
      WATI_API_ENDPOINT: process.env.WATI_API_ENDPOINT,
      WATI_AUTH_TOKEN: process.env.WATI_AUTH_TOKEN ? 'EXISTS' : 'MISSING',
      
      // Verificar si hay variables con nombres diferentes
      BIOTRACK_HOST: process.env.BIOTRACK_HOST,
      BIOTRACK_USER: process.env.BIOTRACK_USER,
      BIOTRACK_PASSWORD: process.env.BIOTRACK_PASSWORD ? 'EXISTS' : 'MISSING'
    };

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working - checking all environment variables',
      environment: envVars,
      timestamp: new Date().toISOString(),
      note: 'Check if variables are being read correctly in production'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
