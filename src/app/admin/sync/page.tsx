'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Download, Upload, Database, AlertCircle } from 'lucide-react';

interface SyncResult {
  success: boolean;
  table: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors: string[];
  lastSyncTime: Date;
}

interface SyncStatus {
  connected: boolean;
  tableCounts: Record<string, number>;
  timestamp: string;
}

export default function BioTrackSyncPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [selectedTables, setSelectedTables] = useState(['customers']);
  const [syncType, setSyncType] = useState<'incremental' | 'full'>('incremental');

  // Cargar estado inicial
  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/biotrack');
      const data = await response.json();
      if (data.success) {
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
  };

  const startSync = async () => {
    setIsLoading(true);
    setSyncResults([]);

    try {
      const response = await fetch('/api/sync/biotrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncType,
          tables: selectedTables
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSyncResults(data.results);
        await loadSyncStatus(); // Recargar estado
      } else {
        console.error('Error en sincronización:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const getSyncStatusIcon = (result: SyncResult) => {
    if (result.success) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (result.errors.length > 0) return <XCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const totalRecords = syncResults.reduce((sum, r) => sum + r.recordsProcessed, 0);
  const totalInserted = syncResults.reduce((sum, r) => sum + r.recordsInserted, 0);
  const totalUpdated = syncResults.reduce((sum, r) => sum + r.recordsUpdated, 0);
  const totalErrors = syncResults.reduce((sum, r) => sum + r.errors.length, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sincronización BioTrack</h1>
          <p className="text-muted-foreground">
            Sincronizar datos desde BioTrack hacia Supabase
          </p>
        </div>
        <Button 
          onClick={loadSyncStatus} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          Actualizar Estado
        </Button>
      </div>

      {/* Estado de Conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de Conexión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={syncStatus?.connected ? "default" : "destructive"}>
              {syncStatus?.connected ? "✅ Conectado" : "❌ Desconectado"}
            </Badge>
            {syncStatus?.timestamp && (
              <span className="text-sm text-muted-foreground">
                Último check: {new Date(syncStatus.timestamp).toLocaleString()}
              </span>
            )}
          </div>
          
          {syncStatus?.tableCounts && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(syncStatus.tableCounts).map(([table, count]) => (
                <div key={table} className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold text-lg">{count.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground capitalize">{table}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="sync" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sync">Sincronización</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Sincronización</CardTitle>
              <CardDescription>
                Selecciona las tablas y tipo de sincronización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Sincronización */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Sincronización</label>
                <div className="flex gap-4">
                  <Button
                    variant={syncType === 'incremental' ? 'default' : 'outline'}
                    onClick={() => setSyncType('incremental')}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Incremental
                  </Button>
                  <Button
                    variant={syncType === 'full' ? 'default' : 'outline'}
                    onClick={() => setSyncType('full')}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Completa
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncType === 'incremental' 
                    ? 'Solo sincroniza registros modificados desde la última sincronización'
                    : 'Sincroniza todos los registros (puede tomar más tiempo)'}
                </p>
              </div>

              {/* Selección de Tablas */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tablas a Sincronizar</label>
                <div className="grid grid-cols-2 gap-2">
                  {['locations', 'customers', 'payments', 'products', 'sales'].map(table => (
                    <div key={table} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={table}
                        checked={selectedTables.includes(table)}
                        onChange={() => handleTableToggle(table)}
                        className="rounded"
                      />
                      <label htmlFor={table} className="text-sm capitalize cursor-pointer">
                        {table}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de Sincronización */}
              <Button 
                onClick={startSync} 
                disabled={isLoading || selectedTables.length === 0 || !syncStatus?.connected}
                className="w-full flex items-center gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Iniciar Sincronización {syncType === 'full' ? 'Completa' : 'Incremental'}
                  </>
                )}
              </Button>

              {!syncStatus?.connected && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No se puede conectar a BioTrack. Verifica la configuración de la base de datos.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {/* Resumen de Resultados */}
          {syncResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Sincronización</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-lg text-blue-600">{totalRecords}</div>
                    <div className="text-sm text-blue-600">Procesados</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-lg text-green-600">{totalInserted}</div>
                    <div className="text-sm text-green-600">Insertados</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="font-semibold text-lg text-yellow-600">{totalUpdated}</div>
                    <div className="text-sm text-yellow-600">Actualizados</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="font-semibold text-lg text-red-600">{totalErrors}</div>
                    <div className="text-sm text-red-600">Errores</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultados por Tabla */}
          <div className="space-y-4">
            {syncResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSyncStatusIcon(result)}
                      <span className="capitalize">{result.table}</span>
                    </div>
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Exitoso" : "Con Errores"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progreso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso</span>
                        <span>{result.recordsProcessed} registros</span>
                      </div>
                      <Progress value={100} className="w-full" />
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-green-600">{result.recordsInserted}</div>
                        <div className="text-muted-foreground">Insertados</div>
                      </div>
                      <div>
                        <div className="font-medium text-blue-600">{result.recordsUpdated}</div>
                        <div className="text-muted-foreground">Actualizados</div>
                      </div>
                      <div>
                        <div className="font-medium text-red-600">{result.errors.length}</div>
                        <div className="text-muted-foreground">Errores</div>
                      </div>
                    </div>

                    {/* Errores */}
                    {result.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <div className="font-medium">Errores encontrados:</div>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              {result.errors.slice(0, 5).map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                              {result.errors.length > 5 && (
                                <li>... y {result.errors.length - 5} errores más</li>
                              )}
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Tiempo */}
                    <div className="text-xs text-muted-foreground">
                      Completado: {new Date(result.lastSyncTime).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
