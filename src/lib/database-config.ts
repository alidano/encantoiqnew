export interface DatabaseConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  location: string;
  locations: number;
  ssl: boolean;
  locationMap: Record<string, string>; // Mapeo de ubicaciones específico para cada servidor
}

// Configuración real de las bases de datos con mapeo de ubicaciones correcto
export const databaseConfigs: DatabaseConfig[] = [
  {
    id: 'encanto-tree-og',
    name: 'Encanto Tree OG',
    host: process.env.BIOTRACK_ENCANTO_TREE_OG_HOST || '64.89.2.20',
    port: parseInt(process.env.BIOTRACK_ENCANTO_TREE_OG_PORT || '5432'),
    database: process.env.BIOTRACK_ENCANTO_TREE_OG_DATABASE || 'biotrackthc',
    user: process.env.BIOTRACK_ENCANTO_TREE_OG_USER || 'egro',
    password: process.env.BIOTRACK_ENCANTO_TREE_OG_PASSWORD || 'swfCi2i4R7NSuEe64TD40qYDuud',
    location: 'Encanto Tree OG',
    locations: 7,
    ssl: false,
    locationMap: {
      "1": "Cultivation",
      "2": "Manufactura", 
      "3": "Dorado",
      "4": "Aguadilla",
      "5": "Bayamon",
      "6": "Isla Verde",
      "7": "Manati"
    }
  },
  {
    id: 'botanik-la-muda',
    name: 'Botanik (LA MUDA)',
    host: process.env.BIOTRACK_BOTANIK_LA_MUDA_HOST || '173.239.206.254',
    port: parseInt(process.env.BIOTRACK_BOTANIK_LA_MUDA_PORT || '5432'),
    database: process.env.BIOTRACK_BOTANIK_LA_MUDA_DATABASE || 'biotrackthc',
    user: process.env.BIOTRACK_BOTANIK_LA_MUDA_USER || 'egro',
    password: process.env.BIOTRACK_BOTANIK_LA_MUDA_PASSWORD || '0TZ1ecWY9xzi3eCltpc1CaJvJ6L',
    location: 'Botanik (LA MUDA)',
    locations: 1,
    ssl: false,
    locationMap: {
      "1": "Botanik Dispensary - Guaynabo"
    }
  },
  {
    id: 'new-encanto',
    name: 'New Encanto',
    host: process.env.BIOTRACK_NEW_ENCANTO_HOST || '64.89.2.17',
    port: parseInt(process.env.BIOTRACK_NEW_ENCANTO_PORT || '5432'),
    database: process.env.BIOTRACK_NEW_ENCANTO_DATABASE || 'biotrackthc',
    user: process.env.BIOTRACK_NEW_ENCANTO_USER || 'egro',
    password: process.env.BIOTRACK_NEW_ENCANTO_PASSWORD || 'rMbIHcXYW652iWzWX6Vo5Zx0uN7',
    location: 'New Encanto',
    locations: 4,
    ssl: false,
    locationMap: {
      "1": "Cupey",
      "2": "Catano", 
      "3": "Corozal",
      "4": "Vega Alta"
    }
  },
];

export function getDatabaseConfig(id: string): DatabaseConfig | undefined {
  return databaseConfigs.find(config => config.id === id);
}

export function getDefaultDatabaseConfig(): DatabaseConfig {
  return databaseConfigs[0];
}

// Función helper para obtener el nombre de ubicación mapeado
export function getLocationName(databaseId: string, locationId: string): string {
  const config = getDatabaseConfig(databaseId);
  if (!config || !config.locationMap[locationId]) {
    return `Location ${locationId} (${config?.name || 'Unknown DB'})`;
  }
  return config.locationMap[locationId];
}
