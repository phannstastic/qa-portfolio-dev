import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { healthRoutes } from './routes/health';
import { createAuthRoutes, type AuthRouteOptions } from './routes/auth';
import { createPublicRoutes, type PublicRouteOptions } from './routes/public';
import { createAdminRoutes, type AdminRouteOptions } from './routes/admin';

import { staticPlugin } from '@elysiajs/static';

const port = Number(process.env.PORT) || 3000;

export interface AppServerOptions
  extends AuthRouteOptions,
    PublicRouteOptions,
    AdminRouteOptions {
  authDb?: any;
}

export const createServer = (options?: AppServerOptions) =>
  new Elysia()
    .use(
      swagger({
        path: '/swagger',
        documentation: {
          info: {
            title: 'QA Portfolio CMS API',
            version: '0.1.0',
            description: 'REST API for Personal QA Portfolio and CMS',
          },
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT Bearer token obtained from POST /api/auth/login',
              },
            },
          },
          tags: [
            { name: 'System', description: 'System health and operational endpoints' },
            { name: 'Authentication', description: 'Admin authentication and session management' },
            { name: 'Profile', description: 'Public portfolio owner profile' },
            { name: 'Skills', description: 'Public technical skills and competencies' },
            { name: 'Projects', description: 'Public portfolio projects showcase' },
            { name: 'Experiences', description: 'Public career journey and professional experiences' },
            { name: 'Contacts', description: 'Public contact message submission' },
            { name: 'Admin Projects', description: 'Admin CMS project management (CRUD)' },
            { name: 'Admin Experiences', description: 'Admin CMS career experience management (CRUD)' },
            { name: 'Admin Contacts', description: 'Admin CMS contact inquiry management' },
          ],
        },
      })
    )
    .use(
      staticPlugin({
        assets: 'public',
        prefix: '',
      })
    )
    .get('/', () => Bun.file('public/index.html'))
    .get('/login', () => Bun.file('public/login.html'))
    .get('/admin', () => Bun.file('public/admin.html'))
    .use(healthRoutes)
    .use(createAuthRoutes({ ...options, db: options?.authDb || options?.db }))
    .use(createPublicRoutes(options))
    .use(createAdminRoutes(options));

export const app = createServer();

if (import.meta.main) {
  app.listen(port, () => {
    console.log(`🦊 Elysia server is running at http://localhost:${port}`);
    console.log(`📚 Swagger documentation available at http://localhost:${port}/swagger`);
  });
}
