import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variables de WATI
    const watiEndpoint = process.env.WATI_API_ENDPOINT;
    const watiToken = process.env.WATI_AUTH_TOKEN;
    
    // Verificar variables de BioTrack
    const biotrackHost = process.env.BIOTRACK_ENCANTO_TREE_OG_HOST;
    const biotrackUser = process.env.BIOTRACK_ENCANTO_TREE_OG_USER;
    
    // Verificar variables generales
    const nodeEnv = process.env.NODE_ENV;
    const amplifyEnv = process.env.AMPLIFY_ENV;
    
    const envStatus = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: nodeEnv,
        AMPLIFY_ENV: amplifyEnv,
      },
      wati: {
        endpoint: watiEndpoint ? 'Present' : 'Missing',
        token: watiToken ? 'Present' : 'Missing',
        endpointValue: watiEndpoint ? `${watiEndpoint.substring(0, 30)}...` : null,
        tokenValue: watiToken ? `${watiToken.substring(0, 30)}...` : null,
      },
      biotrack: {
        host: biotrackHost ? 'Present' : 'Missing',
        user: biotrackUser ? 'Present' : 'Missing',
        hostValue: biotrackHost,
        userValue: biotrackUser,
      },
      allEnvVars: Object.keys(process.env).filter(key => 
        key.includes('WATI') || key.includes('BIOTRACK')
      ),
    };

    console.log('🔍 Environment Variables Test:', envStatus);
    
    return NextResponse.json(envStatus);
    
  } catch (error) {
    console.error('❌ Error testing environment variables:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
