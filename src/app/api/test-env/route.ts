import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variables de WATI
    const watiEndpoint = process.env.WATI_API_ENDPOINT;
    const watiToken = process.env.WATI_AUTH_TOKEN;
    
    // Verificar variables de BioTrack - Encanto Tree OG
    const biotrackEncantoHost = process.env.BIOTRACK_ENCANTO_TREE_OG_HOST;
    const biotrackEncantoUser = process.env.BIOTRACK_ENCANTO_TREE_OG_USER;
    const biotrackEncantoPassword = process.env.BIOTRACK_ENCANTO_TREE_OG_PASSWORD;
    const biotrackEncantoDatabase = process.env.BIOTRACK_ENCANTO_TREE_OG_DATABASE;
    const biotrackEncantoPort = process.env.BIOTRACK_ENCANTO_TREE_OG_PORT;
    
    // Verificar variables de BioTrack - Botanik LA MUDA
    const biotrackBotanikHost = process.env.BIOTRACK_BOTANIK_LA_MUDA_HOST;
    const biotrackBotanikUser = process.env.BIOTRACK_BOTANIK_LA_MUDA_USER;
    const biotrackBotanikPassword = process.env.BIOTRACK_BOTANIK_LA_MUDA_PASSWORD;
    const biotrackBotanikDatabase = process.env.BIOTRACK_BOTANIK_LA_MUDA_DATABASE;
    const biotrackBotanikPort = process.env.BIOTRACK_BOTANIK_LA_MUDA_PORT;
    
    // Verificar variables de BioTrack - New Encanto
    const biotrackNewEncantoHost = process.env.BIOTRACK_NEW_ENCANTO_HOST;
    const biotrackNewEncantoUser = process.env.BIOTRACK_NEW_ENCANTO_USER;
    const biotrackNewEncantoPassword = process.env.BIOTRACK_NEW_ENCANTO_PASSWORD;
    const biotrackNewEncantoDatabase = process.env.BIOTRACK_NEW_ENCANTO_DATABASE;
    const biotrackNewEncantoPort = process.env.BIOTRACK_NEW_ENCANTO_PORT;
    
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
        encantoTreeOG: {
          host: biotrackEncantoHost ? 'Present' : 'Missing',
          user: biotrackEncantoUser ? 'Present' : 'Missing',
          password: biotrackEncantoPassword ? 'Present' : 'Missing',
          database: biotrackEncantoDatabase ? 'Present' : 'Missing',
          port: biotrackEncantoPort ? 'Present' : 'Missing',
          hostValue: biotrackEncantoHost,
          userValue: biotrackEncantoUser,
        },
        botanikLaMuda: {
          host: biotrackBotanikHost ? 'Present' : 'Missing',
          user: biotrackBotanikUser ? 'Present' : 'Missing',
          password: biotrackBotanikPassword ? 'Present' : 'Missing',
          database: biotrackBotanikDatabase ? 'Present' : 'Missing',
          port: biotrackBotanikPort ? 'Present' : 'Missing',
          hostValue: biotrackBotanikHost,
          userValue: biotrackBotanikUser,
        },
        newEncanto: {
          host: biotrackNewEncantoHost ? 'Present' : 'Missing',
          user: biotrackNewEncantoUser ? 'Present' : 'Missing',
          password: biotrackNewEncantoPassword ? 'Present' : 'Missing',
          database: biotrackNewEncantoDatabase ? 'Present' : 'Missing',
          port: biotrackNewEncantoPort ? 'Present' : 'Missing',
          hostValue: biotrackNewEncantoHost,
          userValue: biotrackNewEncantoUser,
        }
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
