// src/app/api/sync/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const databaseId = searchParams.get('databaseId') || 'encanto-tree-og';
    
    console.log('📚 Obteniendo historial de sincronizaciones para:', databaseId);
    
    // Obtener historial de sincronizaciones desde la tabla sync_history
    const { data: historyData, error } = await supabase
      .from('sync_history')
      .select('*')
      .eq('database_id', databaseId)
      .order('start_time', { ascending: false })
      .limit(50); // Limitar a las últimas 50 sincronizaciones
    
    if (error) {
      console.error('❌ Error obteniendo historial:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transformar los datos para el frontend
    const history = historyData?.map(item => ({
      id: item.id,
      databaseId: item.database_id,
      databaseName: item.database_name,
      syncType: item.sync_type,
      tables: item.tables || [],
      startTime: item.start_time,
      endTime: item.end_time,
      duration: item.duration || 0,
      totalRecords: item.total_records || 0,
      totalInserted: item.total_inserted || 0,
      totalUpdated: item.total_updated || 0,
      totalErrors: item.total_errors || 0,
      status: item.status || 'unknown',
      results: item.results || []
    })) || [];

    console.log(`✅ Historial obtenido: ${history.length} sincronizaciones encontradas`);

    return NextResponse.json({
      success: true,
      history,
      databaseId
    });

  } catch (error) {
    console.error('❌ Error en API de historial:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
