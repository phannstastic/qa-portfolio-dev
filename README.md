# qa-portfolio-elysia

Personal portfolio website with REST API and admin CMS, serving as the System Under Test (SUT) for manual testing, API testing, and Selenium + Cucumber automation testing.

---

## Tech Stack
- **Runtime & Package Manager**: [Bun](https://bun.sh/) (v1.4+)
- **Backend Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL
- **Validation**: TypeBox (Elysia native)
- **API Documentation**: OpenAPI / Swagger (`@elysiajs/swagger`)
- **Authentication**: JWT (to be implemented in subsequent tasks)
- **Frontend**: HTML, Tailwind CSS, JavaScript (in `public/`)
- **Testing**: Bun Test, Postman, Selenium, Cucumber

---

## Project Structure
```text
qa-portfolio-elysia/
├── public/                 # Static frontend assets (HTML, CSS, JS)
├── src/
│   ├── db/                 # Drizzle ORM database connection and schema
│   │   └── index.ts
│   ├── routes/             # Elysia modular route handlers
│   │   └── health.ts
│   └── index.ts            # Elysia application entrypoint
├── tests/
│   ├── api/                # API tests (Bun Test / HTTP integration)
│   │   └── health.test.ts
│   └── e2e/                # Selenium & Cucumber E2E test suites
├── .env.example            # Environment template without credentials
├── .gitignore              # Ignored files (node_modules, .env, dist)
├── package.json            # Scripts and dependencies
├── tsconfig.json           # TypeScript configuration for Bun
└── README.md               # Documentation and execution instructions
```

---

## Prerequisites
1. **Bun**: Make sure Bun v1.4+ is installed. Check with:
   ```bash
   bun --version
   ```
2. **MySQL**: MySQL server 8.0+ running locally or remotely (required for upcoming schema migrations and data operations).

---

## Setup & Getting Started

1. **Clone & Install Dependencies**:
   ```bash
   bun install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your environment variables in `.env` as needed:
   ```env
   NODE_ENV=development
   PORT=3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=qa_portfolio
   JWT_SECRET=your_jwt_secret_min_32_chars_placeholder
   ```

3. **Run the Development Server**:
   ```bash
   bun run dev
   ```

4. **Verify Endpoints**:
   - Health check: [http://localhost:3000/health](http://localhost:3000/health)
   - Swagger OpenAPI Docs: [http://localhost:3000/swagger](http://localhost:3000/swagger)

---

## Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `bun run dev` | `bun --watch src/index.ts` | Runs the server in watch/reload mode |
| `bun start` | `bun src/index.ts` | Starts the production server |
| `bun run build` | `bun build src/index.ts --outdir ./dist --target bun` | Bundles the application into `dist/` |
| `bun run typecheck` | `tsc --noEmit` | Runs TypeScript static type checking |
| `bun test` | `bun test` | Executes the test suites |

---

## Status & Scope
- **Task 1 (Completed)**: Project initialization, folder layout, minimal Elysia server, Swagger, health endpoint, environment configuration, typecheck, and test integration.
- Subsequent tasks will introduce the Drizzle database schema, auth system, portfolio REST endpoints, frontend CMS, and automated testing suites.
