import { createDbConnection, users, projects, experiences } from './index';
import { eq, and } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

export interface SeedResult {
  targetDatabase: string;
  adminSeeded: boolean;
  adminSkipped: boolean;
  projectsSeeded: number;
  projectsSkipped: number;
  experiencesSeeded: number;
  experiencesSkipped: number;
}

export const initialProjects = [
  {
    title: 'Elysia API Test Automation Framework',
    slug: 'elysia-api-test-automation-framework',
    description:
      'Automated REST API testing suite utilizing Bun Test, Supertest, and CI/CD pipelines with comprehensive schema validation and performance metrics.',
    category: 'API Testing',
    techStack: 'Bun, ElysiaJS, TypeBox, REST API, GitHub Actions',
    githubUrl: 'https://github.com/example-qa/elysia-api-testing',
    liveDemoUrl: 'http://localhost:3000/swagger',
    imageUrl: '/images/projects/api-testing.png',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    title: 'Selenium + Cucumber BDD Automation',
    slug: 'selenium-cucumber-bdd-automation',
    description:
      'End-to-End behavioral test automation suite featuring Page Object Model (POM), data-driven Gherkin scenarios, and multi-browser execution.',
    category: 'Automation Testing',
    techStack: 'Selenium WebDriver, Cucumber, Java, TestNG, ExtentReports',
    githubUrl: 'https://github.com/example-qa/selenium-cucumber-pom',
    liveDemoUrl: 'https://example.com/demo/e2e-report',
    imageUrl: '/images/projects/selenium-bdd.png',
    isFeatured: true,
    sortOrder: 2,
  },
  {
    title: 'Performance & Load Testing Benchmark',
    slug: 'performance-load-testing-benchmark',
    description:
      'High-throughput stress testing and scalability benchmarking for CMS APIs simulating 1,000+ virtual concurrent users under SLA constraints.',
    category: 'Performance Testing',
    techStack: 'k6, Grafana, InfluxDB, Node.js',
    githubUrl: 'https://github.com/example-qa/k6-load-benchmark',
    liveDemoUrl: 'https://example.com/demo/k6-dashboard',
    imageUrl: '/images/projects/k6-benchmark.png',
    isFeatured: false,
    sortOrder: 3,
  },
];

export const initialExperiences = [
  {
    company: 'Tech Innovations QA Lab',
    role: 'Senior QA Automation Engineer',
    location: 'Jakarta, Indonesia (Hybrid)',
    startDate: '2024-01-15',
    endDate: null,
    isCurrent: true,
    description:
      'Architected automated test frameworks for microservices, reducing regression cycle times by 65%. Led BDD adoption across cross-functional engineering squads.',
    sortOrder: 1,
  },
  {
    company: 'Global Software Solutions',
    role: 'QA Engineer',
    location: 'Bandung, Indonesia',
    startDate: '2022-08-01',
    endDate: '2023-12-31',
    isCurrent: false,
    description:
      'Executed manual exploratory testing, formulated test plans, and developed automated API regression scripts in Postman and Bun Test.',
    sortOrder: 2,
  },
  {
    company: 'Digital Creative Studio',
    role: 'Junior QA Tester',
    location: 'Remote',
    startDate: '2021-01-10',
    endDate: '2022-07-20',
    isCurrent: false,
    description:
      'Documented test cases, managed Jira bug lifecycles, and verified cross-browser UI/UX responsiveness across web and mobile web platforms.',
    sortOrder: 3,
  },
];

/**
 * Pure validation helper: validates environment parameters before executing seed.
 */
export function validateSeedEnvironment(env: Record<string, string | undefined> = process.env): {
  adminPassword: string;
  adminEmail: string;
  expectedDb: string;
} {
  const adminPassword = env.SEED_ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.trim() === '') {
    throw new Error(
      'SEED_ADMIN_PASSWORD environment variable is required but missing or empty. Please provide SEED_ADMIN_PASSWORD in your environment before running seed.'
    );
  }

  const expectedDb = env.DB_NAME || 'qa_portfolio_dev';
  if (expectedDb === 'qa_playground_db') {
    throw new Error(
      'Security violation: Refusing to run seed on protected playground database "qa_playground_db".'
    );
  }

  const adminEmail = env.ADMIN_EMAIL || 'admin@qa-portfolio.local';

  return { adminPassword, adminEmail, expectedDb };
}

/**
 * Idempotent seed script:
 * - Checks existing records before inserting to prevent duplicate entries.
 * - Uses Bun.password.hash for secure bcrypt password hashing (cost 10).
 * - Seeds default admin only if no user with specified admin email exists.
 * - Enforces SEED_ADMIN_PASSWORD from environment.
 * - Verifies connected database session and strictly prohibits qa_playground_db.
 */
export async function runSeed(customDb?: any): Promise<SeedResult> {
  console.log('========================================================');
  console.log('🌱 Starting Safe Database Seeder');
  console.log('========================================================');

  const { adminPassword, adminEmail, expectedDb } = validateSeedEnvironment();
  const db = customDb || createDbConnection();
  const client = (db as any).$client;

  let actualDb = expectedDb;
  if (client?.query) {
    const [[row]] = await client.query('SELECT DATABASE() AS currentDb;');
    actualDb = row?.currentDb;
    console.log(`Connected Database: [${actualDb}]`);

    if (actualDb === 'qa_playground_db') {
      throw new Error(
        'Security violation: Connected session is "qa_playground_db". Seeding is strictly prohibited on this database.'
      );
    }

    if (actualDb !== expectedDb) {
      throw new Error(
        `Database connection mismatch! Target is "${expectedDb}", but connected session is "${actualDb}". Halting immediately.`
      );
    }
  }

  const result: SeedResult = {
    targetDatabase: actualDb,
    adminSeeded: false,
    adminSkipped: false,
    projectsSeeded: 0,
    projectsSkipped: 0,
    experiencesSeeded: 0,
    experiencesSkipped: 0,
  };

  try {
    // 1. Seed Admin User
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length === 0) {
      const passwordHash = await Bun.password.hash(adminPassword, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      await db.insert(users).values({
        name: 'QA Portfolio Admin',
        email: adminEmail,
        passwordHash,
        role: 'superadmin',
      });
      result.adminSeeded = true;
      console.log(`✅ Admin user seeded (${adminEmail})`);
    } else {
      result.adminSkipped = true;
      console.log(`ℹ️ Admin user already exists (${adminEmail}), skipping.`);
    }

    // 2. Seed Portfolio Projects
    for (const proj of initialProjects) {
      const existing = await db
        .select()
        .from(projects)
        .where(eq(projects.slug, proj.slug))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(projects).values(proj);
        result.projectsSeeded++;
        console.log(`✅ Seeded project: ${proj.title}`);
      } else {
        result.projectsSkipped++;
        console.log(`ℹ️ Project already exists (${proj.slug}), skipping.`);
      }
    }

    // 3. Seed Experiences
    for (const exp of initialExperiences) {
      const existing = await db
        .select()
        .from(experiences)
        .where(and(eq(experiences.company, exp.company), eq(experiences.role, exp.role)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(experiences).values(exp);
        result.experiencesSeeded++;
        console.log(`✅ Seeded experience: ${exp.role} at ${exp.company}`);
      } else {
        result.experiencesSkipped++;
        console.log(`ℹ️ Experience at ${exp.company} (${exp.role}) already exists, skipping.`);
      }
    }

    console.log('========================================================');
    console.log('🎉 Seeding completed successfully!');
    console.log(
      `Summary: Admin: ${result.adminSeeded ? 'Seeded' : 'Skipped'}, Projects: ${result.projectsSeeded} new (${result.projectsSkipped} skipped), Experiences: ${result.experiencesSeeded} new (${result.experiencesSkipped} skipped)`
    );
    console.log('========================================================');

    return result;
  } finally {
    if (!customDb && client?.end) {
      await client.end();
    }
  }
}

if (import.meta.main) {
  runSeed().catch((err) => {
    console.error('❌ Seeding failed:', err.message || err);
    process.exit(1);
  });
}
