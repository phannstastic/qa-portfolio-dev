import { drizzle } from 'drizzle-orm/mysql2';
import mysql, { type PoolOptions } from 'mysql2/promise';
import * as schema from './schema';

/**
 * Resolves MySQL connection pool configuration from environment variables.
 * Default connectionLimit is 4 to safely fit within Silly Development's free MariaDB
 * hard limit of 5 concurrent connections, configurable via DB_CONNECTION_LIMIT.
 */
export function getDbConfig(env: Record<string, string | undefined> = process.env): PoolOptions {
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'qa_portfolio_dev',
    waitForConnections: true,
    connectionLimit: Number(env.DB_CONNECTION_LIMIT) || 4,
    queueLimit: 0,
  };
}

/**
 * Factory to create a MySQL pool connection using environment variables.
 */
export const createDbConnection = (customConfig?: PoolOptions) => {
  const poolConfig = customConfig || getDbConfig();
  const poolConnection = mysql.createPool(poolConfig);

  return drizzle(poolConnection, { schema, mode: 'default' });
};

export * from './schema';
