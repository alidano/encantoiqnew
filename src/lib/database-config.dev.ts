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

// Development configuration with default values (safe to commit)
export const databaseConfigsDev: DatabaseConfig[] = [
  {
    id: 'encanto-tree-og',
    name: 'Encanto Tree OG',
    host: '64.89.2.20',
    port: 5432,
    database: 'biotrackthc',
    user: 'egro',
    password: 'swfCi2i4R7NSuEe64TD40qYDuud',
    location: 'Encanto Tree OG',
    locations: 5,
    ssl: false,
  },
  {
    id: 'botanik-la-muda',
    name: 'Botanik (LA MUDA)',
    host: '173.239.206.254',
    port: 5432,
    database: 'biotrackthc',
    user: 'egro',
    password: '0TZ1ecWY9xzi3eCltpc1CaJvJ6L',
    location: 'Botanik (LA MUDA)',
    locations: 1,
    ssl: false,
  },
  {
    id: 'new-encanto',
    name: 'New Encanto',
    host: '64.89.2.17',
    port: 5432,
    database: 'biotrackthc',
    user: 'egro',
    password: 'rMbIHcXYW652iWzWX6Vo5Zx0uN7',
    location: 'New Encanto',
    locations: 3,
    ssl: false,
  },
];

export function getDatabaseConfigDev(id: string): DatabaseConfig | undefined {
  return databaseConfigsDev.find(config => config.id === id);
}

export function getDefaultDatabaseConfigDev(): DatabaseConfig {
  return databaseConfigsDev[0];
}
