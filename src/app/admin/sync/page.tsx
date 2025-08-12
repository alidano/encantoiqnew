'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Download, Upload, Database, AlertCircle, Server, Home, Users, BarChart3 } from 'lucide-react';
import { databaseConfigs, DatabaseConfig } from '@/lib/database-config';
import Link from 'next/link';

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
  databaseId?: string;
}

interface SyncHistory {
  id: string;
  databaseId: string;
  databaseName: string;
  syncType: 'incremental' | 'full';
  tables: string[];
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  totalRecords: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  status: 'success' | 'partial' | 'failed';
  results: SyncResult[];
}

export default function BioTrackSyncPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [selectedTables, setSelectedTables] = useState(['customers']);
  const [syncType, setSyncType] = useState<'incremental' | 'full'>('incremental');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('encanto-tree-og');
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    loadSyncStatus();
    loadSyncHistory();
  }, [selectedDatabase]);

  const loadSyncStatus = async () => {
    try {
      const response = await fetch(`/api/sync/biotrack?databaseId=${selectedDatabase}`);
      const data = await response.json();
      if (data.success) {
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Error cargando estado:', error);
    }
  };

  const loadSyncHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/sync/history?databaseId=${selectedDatabase}`);
      const data = await response.json();
      if (data.success) {
        setSyncHistory(data.history);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setIsLoadingHistory(false);
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
          tables: selectedTables,
          databaseId: selectedDatabase
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSyncResults(data.results);
        await loadSyncStatus(); // Recargar estado
        await loadSyncHistory(); // Recargar historial
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

  const getSelectedDatabaseConfig = (): DatabaseConfig | undefined => {
    return databaseConfigs.find(config => config.id === selectedDatabase);
  };

  const getStatusBadge = (status: 'success' | 'partial' | 'failed') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">✅ Exitoso</Badge>;
      case 'partial':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-700">⚠️ Parcial</Badge>;
      case 'failed':
        return <Badge variant="destructive">❌ Fallido</Badge>;
      default:
        return <Badge variant="outline">❓ Desconocido</Badge>;
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const totalRecords = syncResults.reduce((sum, r) => sum + r.recordsProcessed, 0);
  const totalInserted = syncResults.reduce((sum, r) => sum + r.recordsInserted, 0);
  const totalUpdated = syncResults.reduce((sum, r) => sum + r.recordsUpdated, 0);
  const totalErrors = syncResults.reduce((sum, r) => sum + r.errors.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Sincronización BioTrack</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link href="/patients" className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
                <Users className="h-4 w-4" />
                <span>Patients</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sincronización BioTrack</h2>
            <p className="text-gray-600">
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

        {/* Selector de Base de Datos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Seleccionar Base de Datos
            </CardTitle>
            <CardDescription>
              Elige la base de datos de BioTrack que deseas sincronizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {databaseConfigs.map((config) => (
                  <div
                    key={config.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDatabase === config.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDatabase(config.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{config.name}</h3>
                      <Badge variant="outline">{config.locations} {config.locations === 1 ? 'Ubicación' : 'Ubicaciones'}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Servidor:</strong> {config.host}</div>
                      <div><strong>Base de datos:</strong> {config.database}</div>
                      <div><strong>Ubicación:</strong> {config.location}</div>
                    </div>
                    {selectedDatabase === config.id && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <Badge variant="default" className="w-full justify-center">
                          ✅ Seleccionado
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado de Conexión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Estado de Conexión - {getSelectedDatabaseConfig()?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant={syncStatus?.connected ? "default" : "destructive"}>
                {syncStatus?.connected ? "✅ Conectado" : "❌ Desconectado"}
              </Badge>
              {syncStatus?.timestamp && (
                <span className="text-sm text-gray-600">
                  Último check: {new Date(syncStatus.timestamp).toLocaleString()}
                </span>
              )}
            </div>
            
            {syncStatus?.tableCounts && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(syncStatus.tableCounts).map(([table, count]) => (
                  <div key={table} className="text-center p-3 bg-gray-100 rounded-lg">
                    <div className="font-semibold text-lg">{count.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 capitalize">{table}</div>
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
                  Selecciona las tablas y tipo de sincronización para {getSelectedDatabaseConfig()?.name}
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
                  <p className="text-xs text-gray-600">
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
                      Iniciar Sincronización {syncType === 'full' ? 'Completa' : 'Incremental'} - {getSelectedDatabaseConfig()?.name}
                    </>
                  )}
                </Button>

                {!syncStatus?.connected && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No se puede conectar a {getSelectedDatabaseConfig()?.name}. Verifica la configuración de la base de datos.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {/* Resumen de Resultados Actuales */}
            {syncResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Resultados de Sincronización Actual - {getSelectedDatabaseConfig()?.name}
                  </CardTitle>
                  <CardDescription>
                    Resultados de la última sincronización ejecutada
                  </CardDescription>
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

            {/* Historial de Sincronizaciones */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Historial de Sincronizaciones - {getSelectedDatabaseConfig()?.name}
                    </CardTitle>
                    <CardDescription>
                      Historial completo de todas las sincronizaciones ejecutadas
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={loadSyncHistory} 
                    variant="outline" 
                    size="sm"
                    disabled={isLoadingHistory}
                  >
                    {isLoadingHistory ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                    Actualizar Historial
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando historial...</p>
                  </div>
                ) : syncHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay historial de sincronizaciones disponible</p>
                    <p className="text-sm text-gray-500">Ejecuta una sincronización para ver el historial</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Estadísticas del Historial */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="font-semibold text-lg text-blue-600">{syncHistory.length}</div>
                        <div className="text-sm text-gray-600">Total Sincronizaciones</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-green-600">
                          {syncHistory.filter(h => h.status === 'success').length}
                        </div>
                        <div className="text-sm text-gray-600">Exitosas</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-yellow-600">
                          {syncHistory.filter(h => h.status === 'partial').length}
                        </div>
                        <div className="text-sm text-gray-600">Parciales</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-red-600">
                          {syncHistory.filter(h => h.status === 'failed').length}
                        </div>
                        <div className="text-sm text-gray-600">Fallidas</div>
                      </div>
                    </div>

                    {/* Lista del Historial */}
                    <div className="space-y-3">
                      {syncHistory.map((historyItem, index) => (
                        <div key={historyItem.id || index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {getStatusBadge(historyItem.status)}
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  Sincronización {historyItem.syncType === 'full' ? 'Completa' : 'Incremental'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(historyItem.startTime).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Duración</div>
                              <div className="font-medium">{formatDuration(historyItem.duration)}</div>
                            </div>
                          </div>

                          {/* Detalles de la Sincronización */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-medium text-blue-700">{historyItem.totalRecords.toLocaleString()}</div>
                              <div className="text-xs text-blue-600">Procesados</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-medium text-green-700">{historyItem.totalInserted.toLocaleString()}</div>
                              <div className="text-xs text-green-600">Insertados</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded">
                              <div className="font-medium text-yellow-700">{historyItem.totalUpdated.toLocaleString()}</div>
                              <div className="text-xs text-yellow-600">Actualizados</div>
                            </div>
                            <div className="text-center p-2 bg-red-50 rounded">
                              <div className="font-medium text-red-700">{historyItem.totalErrors.toLocaleString()}</div>
                              <div className="text-xs text-red-600">Errores</div>
                            </div>
                          </div>

                          {/* Tablas Sincronizadas */}
                          <div className="mb-3">
                            <div className="text-sm font-medium text-gray-700 mb-2">Tablas sincronizadas:</div>
                            <div className="flex flex-wrap gap-2">
                              {historyItem.tables.map((table, tableIndex) => (
                                <Badge key={tableIndex} variant="outline" className="text-xs">
                                  {table}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Resultados por Tabla */}
                          <div className="space-y-2">
                            {historyItem.results.map((result, resultIndex) => (
                              <div key={resultIndex} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  {getSyncStatusIcon(result)}
                                  <span className="capitalize font-medium">{result.table}</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-600">
                                  <span>{result.recordsProcessed} procesados</span>
                                  <span className="text-green-600">{result.recordsInserted} insertados</span>
                                  <span className="text-blue-600">{result.recordsUpdated} actualizados</span>
                                  {result.errors.length > 0 && (
                                    <span className="text-red-600">{result.errors.length} errores</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Tiempo de Finalización */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                              Finalizado: {new Date(historyItem.endTime).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resultados por Tabla de la Sincronización Actual */}
            {syncResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalles por Tabla - Sincronización Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {syncResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getSyncStatusIcon(result)}
                            <span className="capitalize font-medium">{result.table}</span>
                          </div>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? "Exitoso" : "Con Errores"}
                          </Badge>
                        </div>

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
                              <div className="text-gray-600">Insertados</div>
                            </div>
                            <div>
                              <div className="font-medium text-blue-600">{result.recordsUpdated}</div>
                              <div className="text-gray-600">Actualizados</div>
                            </div>
                            <div>
                              <div className="font-medium text-red-600">{result.errors.length}</div>
                              <div className="text-gray-600">Errores</div>
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
                          <div className="text-xs text-gray-600">
                            Completado: {new Date(result.lastSyncTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
