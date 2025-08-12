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

// Import development config for local development
import { databaseConfigsDev, getDatabaseConfigDev, getDefaultDatabaseConfigDev } from './database-config.dev';

// Production configuration using environment variables
const databaseConfigsProd: DatabaseConfig[] = [
  {
    id: 'encanto-tree-og',
    name: 'Encanto Tree OG',
    host: process.env.BIOTRACK_HOST_1 || '',
    port: parseInt(process.env.BIOTRACK_PORT_1 || '5432'),
    database: process.env.BIOTRACK_DATABASE_1 || 'biotrackthc',
    user: process.env.BIOTRACK_USER_1 || '',
    password: process.env.BIOTRACK_PASSWORD_1 || '',
    location: 'Encanto Tree OG',
    locations: 5,
    ssl: false,
  },
  {
    id: 'botanik-la-muda',
    name: 'Botanik (LA MUDA)',
    host: process.env.BIOTRACK_HOST_2 || '',
    port: parseInt(process.env.BIOTRACK_PORT_2 || '5432'),
    database: process.env.BIOTRACK_DATABASE_2 || 'biotrackthc',
    user: process.env.BIOTRACK_USER_2 || '',
    password: process.env.BIOTRACK_PASSWORD_2 || '',
    location: 'Botanik (LA MUDA)',
    locations: 1,
    ssl: false,
  },
  {
    id: 'new-encanto',
    name: 'New Encanto',
    host: process.env.BIOTRACK_HOST_3 || '',
    port: parseInt(process.env.BIOTRACK_PORT_3 || '5432'),
    database: process.env.BIOTRACK_DATABASE_3 || 'biotrackthc',
    user: process.env.BIOTRACK_USER_3 || '',
    password: process.env.BIOTRACK_PASSWORD_3 || '',
    location: 'New Encanto',
    locations: 3,
    ssl: false,
  },
];

// Use development config in development, production config in production
const isDevelopment = process.env.NODE_ENV === 'development';
export const databaseConfigs: DatabaseConfig[] = isDevelopment ? databaseConfigsDev : databaseConfigsProd;

export function getDatabaseConfig(id: string): DatabaseConfig | undefined {
  if (isDevelopment) {
    return getDatabaseConfigDev(id);
  }
  return databaseConfigs.find(config => config.id === id);
}

export function getDefaultDatabaseConfig(): DatabaseConfig | undefined {
  if (isDevelopment) {
    return getDefaultDatabaseConfigDev();
  }
  
  // Only return config if environment variables are properly set
  const config = databaseConfigs[0];
  if (config.host && config.user && config.password) {
    return config;
  }
  return undefined;
}

// Helper function to check if database configs are valid
export function areDatabaseConfigsValid(): boolean {
  return databaseConfigs.every(config => 
    config.host && config.user && config.password
  );
}
