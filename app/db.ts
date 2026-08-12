import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve(__dirname, 'data', 'taskflow.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin', 'manager', 'member')),
    avatar_url TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    assignee_id INTEGER DEFAULT NULL,
    due_date TEXT DEFAULT NULL,
    tags TEXT DEFAULT '[]',
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    uploaded_by INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  );
`);

// ─────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function seedDatabase() {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET name=excluded.name, password=excluded.password, role=excluded.role
  `);

  const users = [
    { name: 'Admin User', email: 'admin@taskflow.com', password: hashPassword('Admin123!'), role: 'admin' },
    { name: 'Sarah Chen', email: 'sarah@taskflow.com', password: hashPassword('Sarah123!'), role: 'manager' },
    { name: 'James Wilson', email: 'james@taskflow.com', password: hashPassword('James123!'), role: 'member' },
    { name: 'Emily Rodriguez', email: 'emily@taskflow.com', password: hashPassword('Emily123!'), role: 'member' },
    { name: 'Michael Park', email: 'michael@taskflow.com', password: hashPassword('Member123!'), role: 'member' },
  ];

  for (const u of users) {
    insertUser.run(u.name, u.email, u.password, u.role);
  }
}

  // ── Tasks ──
  const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, assignee_id, due_date, tags, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasks = [
    { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', status: 'done', priority: 'high', assignee_id: 1, due_date: '2026-08-05', tags: '["devops","automation"]', created_by: 1 },
    { title: 'Design user dashboard', description: 'Create wireframes and mockups for the main dashboard view', status: 'done', priority: 'medium', assignee_id: 2, due_date: '2026-08-03', tags: '["design","ui"]', created_by: 1 },
    { title: 'Implement authentication', description: 'Build login/register flow with JWT token management', status: 'in-progress', priority: 'critical', assignee_id: 3, due_date: '2026-08-07', tags: '["backend","security"]', created_by: 1 },
    { title: 'Write API documentation', description: 'Document all REST API endpoints using Swagger/OpenAPI spec', status: 'todo', priority: 'low', assignee_id: 4, due_date: '2026-08-12', tags: '["docs"]', created_by: 2 },
    { title: 'Database schema migration', description: 'Plan and execute database schema changes for v2 features', status: 'in-progress', priority: 'high', assignee_id: 1, due_date: '2026-08-06', tags: '["backend","database"]', created_by: 1 },
    { title: 'Fix login page validation', description: 'Email field accepts invalid format, password requirements not shown', status: 'todo', priority: 'medium', assignee_id: 3, due_date: '2026-08-08', tags: '["bug","frontend"]', created_by: 2 },
    { title: 'Add drag-and-drop to board', description: 'Implement drag-and-drop task reordering on the Kanban board', status: 'todo', priority: 'high', assignee_id: 2, due_date: '2026-08-10', tags: '["frontend","feature"]', created_by: 1 },
    { title: 'Performance audit', description: 'Run Lighthouse audit and fix performance bottlenecks', status: 'todo', priority: 'low', assignee_id: 5, due_date: '2026-08-15', tags: '["performance"]', created_by: 2 },
    { title: 'Unit tests for API layer', description: 'Write comprehensive unit tests for all API endpoint handlers', status: 'in-progress', priority: 'medium', assignee_id: 4, due_date: '2026-08-09', tags: '["testing","backend"]', created_by: 1 },
    { title: 'Deploy to staging', description: 'Set up staging environment and deploy latest build for QA testing', status: 'todo', priority: 'critical', assignee_id: 1, due_date: '2026-08-04', tags: '["devops","deployment"]', created_by: 1 },
    { title: 'Mobile responsive layout', description: 'Make all pages responsive for tablet and mobile screen sizes', status: 'todo', priority: 'medium', assignee_id: 2, due_date: '2026-08-14', tags: '["frontend","responsive"]', created_by: 2 },
    { title: 'User role permissions', description: 'Implement role-based access control for admin, manager, and member roles', status: 'in-progress', priority: 'high', assignee_id: 1, due_date: '2026-08-11', tags: '["backend","security"]', created_by: 1 },
  ];

  const insertTasks = db.transaction(() => {
    for (const t of tasks) {
      insertTask.run(t.title, t.description, t.status, t.priority, t.assignee_id, t.due_date, t.tags, t.created_by);
    }
  });
  insertTasks();

  // ── Comments ──
  const insertComment = db.prepare(`
    INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)
  `);

  const comments = [
    { task_id: 1, user_id: 1, content: 'Pipeline is configured. Added test, lint, and deploy stages.' },
    { task_id: 1, user_id: 2, content: 'Looks great! Can we add a manual approval step before prod deploy?' },
    { task_id: 3, user_id: 3, content: 'Working on the JWT refresh token flow. Should be done by EOD.' },
    { task_id: 3, user_id: 1, content: 'Make sure to add rate limiting on the login endpoint.' },
    { task_id: 5, user_id: 1, content: 'Schema changes documented in the migration plan doc.' },
    { task_id: 7, user_id: 2, content: 'Looking into react-beautiful-dnd vs dnd-kit for this.' },
    { task_id: 9, user_id: 4, content: 'Tests for /auth and /tasks endpoints are done. Starting /users next.' },
    { task_id: 10, user_id: 1, content: 'Staging server is provisioned. Need to configure env variables.' },
  ];

  const insertComments = db.transaction(() => {
    for (const c of comments) {
      insertComment.run(c.task_id, c.user_id, c.content);
    }
  });
  insertComments();

  console.log('✅ Database seeded with users, tasks, and comments');
}

seedDatabase();

export default db;
export { hashPassword };
