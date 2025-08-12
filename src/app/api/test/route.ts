import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variables de entorno
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      BIOTRACK_HOST_1: process.env.BIOTRACK_HOST_1,
      BIOTRACK_USER_1: process.env.BIOTRACK_USER_1,
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING'
    };

    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
