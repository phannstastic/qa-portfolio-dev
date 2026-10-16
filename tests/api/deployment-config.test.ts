import { describe, expect, it } from 'bun:test';
import { getServerConfig } from '../../src/index';
import { getDbConfig } from '../../src/db/index';

describe('Deployment Configuration (Silly Development Compatibility)', () => {
  describe('Server Port & Host Configuration (getServerConfig)', () => {
    it('prioritizes SERVER_PORT when provided by PaaS/SillyDev environment', () => {
      const env = {
        SERVER_PORT: '25432',
        PORT: '3000',
      };
      const config = getServerConfig(env);
      expect(config.port).toBe(25432);
      expect(config.hostname).toBe('0.0.0.0');
    });

    it('falls back to PORT when SERVER_PORT is not defined', () => {
      const env = {
        PORT: '8080',
      };
      const config = getServerConfig(env);
      expect(config.port).toBe(8080);
      expect(config.hostname).toBe('0.0.0.0');
    });

    it('falls back to default port 3000 when neither is defined', () => {
      const env = {};
      const config = getServerConfig(env);
      expect(config.port).toBe(3000);
      expect(config.hostname).toBe('0.0.0.0');
    });

    it('respects custom HOST environment variable when specified', () => {
      const env = {
        HOST: '127.0.0.1',
        PORT: '4000',
      };
      const config = getServerConfig(env);
      expect(config.port).toBe(4000);
      expect(config.hostname).toBe('127.0.0.1');
    });
  });

  describe('Database Connection Pool Configuration (getDbConfig)', () => {
    it('defaults connectionLimit to 4 for Silly Development MariaDB limit (max 5)', () => {
      const env = {};
      const config = getDbConfig(env);
      expect(config.connectionLimit).toBe(4);
      expect(config.waitForConnections).toBe(true);
      expect(config.queueLimit).toBe(0);
      expect(config.host).toBe('127.0.0.1');
      expect(config.port).toBe(3306);
      expect(config.database).toBe('qa_portfolio_dev');
    });

    it('respects custom DB_CONNECTION_LIMIT from environment', () => {
      const env = {
        DB_CONNECTION_LIMIT: '10',
      };
      const config = getDbConfig(env);
      expect(config.connectionLimit).toBe(10);
    });

    it('correctly maps custom database credentials for production deployment', () => {
      const env = {
        DB_HOST: 'mariadb.sillydev.co.uk',
        DB_PORT: '3307',
        DB_USER: 'u123_portfolio',
        DB_PASSWORD: 'secretpassword',
        DB_NAME: 's123_irfanlab',
        DB_CONNECTION_LIMIT: '3',
      };
      const config = getDbConfig(env);
      expect(config.host).toBe('mariadb.sillydev.co.uk');
      expect(config.port).toBe(3307);
      expect(config.user).toBe('u123_portfolio');
      expect(config.password).toBe('secretpassword');
      expect(config.database).toBe('s123_irfanlab');
      expect(config.connectionLimit).toBe(3);
    });
  });
});
