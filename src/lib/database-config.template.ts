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
}

// Template configuration - replace with actual values from environment variables
export const databaseConfigs: DatabaseConfig[] = [
  {
    id: 'encanto-tree-og',
    name: 'Encanto Tree OG',
    host: process.env.BIOTRACK_HOST_1 || 'your-host-1',
    port: parseInt(process.env.BIOTRACK_PORT_1 || '5432'),
    database: process.env.BIOTRACK_DATABASE_1 || 'biotrackthc',
    user: process.env.BIOTRACK_USER_1 || 'your-username-1',
    password: process.env.BIOTRACK_PASSWORD_1 || 'your-password-1',
    location: 'Encanto Tree OG',
    locations: 5,
    ssl: false,
  },
  {
    id: 'botanik-la-muda',
    name: 'Botanik (LA MUDA)',
    host: process.env.BIOTRACK_HOST_2 || 'your-host-2',
    port: parseInt(process.env.BIOTRACK_PORT_2 || '5432'),
    database: process.env.BIOTRACK_DATABASE_2 || 'biotrackthc',
    user: process.env.BIOTRACK_USER_2 || 'your-username-2',
    password: process.env.BIOTRACK_PASSWORD_2 || 'your-password-2',
    location: 'Botanik (LA MUDA)',
    locations: 1,
    ssl: false,
  },
  {
    id: 'new-encanto',
    name: 'New Encanto',
    host: process.env.BIOTRACK_HOST_3 || 'your-host-3',
    port: parseInt(process.env.BIOTRACK_PORT_3 || '5432'),
    database: process.env.BIOTRACK_DATABASE_3 || 'biotrackthc',
    user: process.env.BIOTRACK_USER_3 || 'your-username-3',
    password: process.env.BIOTRACK_PASSWORD_3 || 'your-password-3',
    location: 'New Encanto',
    locations: 3,
    ssl: false,
  },
];

export function getDatabaseConfig(id: string): DatabaseConfig | undefined {
  return databaseConfigs.find(config => config.id === id);
}

export function getDefaultDatabaseConfig(): DatabaseConfig {
  return databaseConfigs[0]; // Return first config as default
}
