import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

/**
 * Factory to create a MySQL pool connection using environment variables.
 */
export const createDbConnection = () => {
  const poolConnection = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'qa_portfolio_dev',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return drizzle(poolConnection, { schema, mode: 'default' });
};

export * from './schema';
