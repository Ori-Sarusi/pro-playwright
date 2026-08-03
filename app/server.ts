import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import db, { hashPassword } from './db';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'taskflow-pro-secret-2026';

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE
// ─────────────────────────────────────────────────────────────

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string; name: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ status: 'UP', app: 'TaskFlow Pro', version: '1.0.0' });
});

// ─────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/v1/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const result = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(name, email, hashPassword(password), 'member');
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid) as any;

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({ token, user });
});

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

app.get('/api/v1/dashboard/stats', authenticateToken, (_req: AuthRequest, res: Response) => {
  const total = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
  const todo = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'todo'").get() as any).count;
  const inProgress = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in-progress'").get() as any).count;
  const done = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'").get() as any).count;
  const overdue = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE due_date < date('now') AND status != 'done'").get() as any).count;

  res.json({ total, todo, inProgress, done, overdue });
});

// ─────────────────────────────────────────────────────────────
// TASKS CRUD
// ─────────────────────────────────────────────────────────────

// GET /api/v1/tasks — List tasks with optional filters
app.get('/api/v1/tasks', authenticateToken, (req: AuthRequest, res: Response) => {
  let query = `
    SELECT t.*, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (req.query.status) { query += ' AND t.status = ?'; params.push(req.query.status); }
  if (req.query.priority) { query += ' AND t.priority = ?'; params.push(req.query.priority); }
  if (req.query.assignee_id) { query += ' AND t.assignee_id = ?'; params.push(req.query.assignee_id); }
  if (req.query.search) { query += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${req.query.search}%`, `%${req.query.search}%`); }

  // Sorting
  const sortField = (req.query.sort as string) || 'created_at';
  const sortOrder = (req.query.order as string) === 'asc' ? 'ASC' : 'DESC';
  const allowedSorts = ['title', 'priority', 'status', 'due_date', 'created_at'];
  if (allowedSorts.includes(sortField)) {
    query += ` ORDER BY t.${sortField} ${sortOrder}`;
  }

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const countQuery = query.replace(/SELECT t\.\*, u\.name as assignee_name/, 'SELECT COUNT(*) as total');
  const totalResult = db.prepare(countQuery).get(...params) as any;

  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const tasks = db.prepare(query).all(...params);

  res.json({
    data: tasks,
    pagination: {
      page,
      limit,
      total: totalResult.total,
      totalPages: Math.ceil(totalResult.total / limit),
    },
  });
});

// GET /api/v1/tasks/:id — Single task with comments & attachments
app.get('/api/v1/tasks/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const task = db.prepare(`
    SELECT t.*, u.name as assignee_name, creator.name as creator_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users creator ON t.created_by = creator.id
    WHERE t.id = ?
  `).get(req.params.id) as any;

  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comments = db.prepare(`
    SELECT c.*, u.name as user_name
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  const attachments = db.prepare(`
    SELECT a.*, u.name as uploaded_by_name
    FROM attachments a
    JOIN users u ON a.uploaded_by = u.id
    WHERE a.task_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  res.json({ ...task, comments, attachments });
});

// POST /api/v1/tasks — Create task
app.post('/api/v1/tasks', authenticateToken, (req: AuthRequest, res: Response) => {
  const { title, description, status, priority, assignee_id, due_date, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, priority, assignee_id, due_date, tags, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || '',
    status || 'todo',
    priority || 'medium',
    assignee_id || null,
    due_date || null,
    tags ? JSON.stringify(tags) : '[]',
    req.user!.id
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PUT /api/v1/tasks/:id — Update task
app.put('/api/v1/tasks/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status, priority, assignee_id, due_date, tags } = req.body;

  db.prepare(`
    UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, due_date = ?, tags = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ?? task.title,
    description ?? task.description,
    status ?? task.status,
    priority ?? task.priority,
    assignee_id !== undefined ? assignee_id : task.assignee_id,
    due_date !== undefined ? due_date : task.due_date,
    tags ? JSON.stringify(tags) : task.tags,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/v1/tasks/:id — Delete task
app.delete('/api/v1/tasks/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted', id: Number(req.params.id) });
});

// ─────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────

app.post('/api/v1/tasks/:taskId/comments', authenticateToken, (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Comment content is required' });

  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const result = db.prepare('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)').run(req.params.taskId, req.user!.id, content);
  const comment = db.prepare('SELECT c.*, u.name as user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(result.lastInsertRowid);
  res.status(201).json(comment);
});

app.delete('/api/v1/comments/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Comment deleted', id: Number(req.params.id) });
});

// ─────────────────────────────────────────────────────────────
// ATTACHMENTS / FILE UPLOAD & DOWNLOAD
// ─────────────────────────────────────────────────────────────

app.post('/api/v1/tasks/:taskId/attachments', authenticateToken, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File is required' });

  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const result = db.prepare('INSERT INTO attachments (task_id, filename, original_name, size, uploaded_by) VALUES (?, ?, ?, ?, ?)').run(
    req.params.taskId, req.file.filename, req.file.originalname, req.file.size, req.user!.id
  );

  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(attachment);
});

app.get('/api/v1/attachments/:id/download', authenticateToken, (req: AuthRequest, res: Response) => {
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id) as any;
  if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

  const filePath = path.join(uploadsDir, attachment.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  res.download(filePath, attachment.original_name);
});

app.delete('/api/v1/attachments/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id) as any;
  if (!attachment) return res.status(404).json({ error: 'Attachment not found' });

  const filePath = path.join(uploadsDir, attachment.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Attachment deleted', id: Number(req.params.id) });
});

// ─────────────────────────────────────────────────────────────
// USERS MANAGEMENT
// ─────────────────────────────────────────────────────────────

app.get('/api/v1/users', authenticateToken, (_req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY id').all();
  res.json({ data: users });
});

app.get('/api/v1/users/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.put('/api/v1/users/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, email, role } = req.body;
  db.prepare("UPDATE users SET name = ?, email = ?, role = ?, updated_at = datetime('now') WHERE id = ?").run(
    name ?? user.name, email ?? user.email, role ?? user.role, req.params.id
  );

  const updated = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/v1/users/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted', id: Number(req.params.id) });
});

// ─────────────────────────────────────────────────────────────
// SPA FALLBACK
// ─────────────────────────────────────────────────────────────

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow Pro running on http://localhost:${PORT}`);
});
