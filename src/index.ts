import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { healthRoutes } from './routes/health';

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'QA Portfolio CMS API',
          version: '0.1.0',
          description: 'REST API for Personal QA Portfolio and CMS',
        },
        tags: [
          { name: 'System', description: 'System health and operational endpoints' },
        ],
      },
    })
  )
  .use(healthRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`🦊 Elysia server is running at http://localhost:${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/swagger`);
  });
}
