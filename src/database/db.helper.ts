import sqlite3 from 'sqlite3';
import { config } from '../core/config/env.config';
import { Logger } from '../core/utils/logger';

export interface TaskRecord {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  user_id: number;
  created_at: string;
}

export interface UserRecord {
  id: number;
  email: string;
  name: string;
  role: string;
}

export class DbHelper {
  private getDbConnection(): sqlite3.Database {
    return new sqlite3.Database(config.dbPath);
  }

  /**
   * Execute SELECT query returning all matching rows
   */
  async queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = this.getDbConnection();
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows: any[]) => {
        db.close();
        if (err) {
          Logger.error(`DB Query failed: ${sql}`, err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  /**
   * Execute SELECT query returning single row
   */
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await this.queryAll<T>(sql, params);
    return rows[0];
  }

  /**
   * Get Task by title from SQLite database directly
   */
  async getTaskByTitle(title: string): Promise<TaskRecord | undefined> {
    Logger.info(`DB Helper: Querying task with title "${title}"`);
    return await this.queryOne<TaskRecord>('SELECT * FROM tasks WHERE title = ?', [title]);
  }

  /**
   * Count total tasks in DB
   */
  async getTaskCount(): Promise<number> {
    const res = await this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM tasks');
    return res ? res.count : 0;
  }

  /**
   * Directly insert task record into DB (for setup/seeding)
   */
  async seedTask(task: { title: string; description?: string; status?: string; priority?: string; user_id?: number }): Promise<number> {
    const db = this.getDbConnection();
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tasks (title, description, status, priority, user_id) VALUES (?, ?, ?, ?, ?)`,
        [task.title, task.description || '', task.status || 'todo', task.priority || 'medium', task.user_id || 1],
        function (err) {
          db.close();
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Delete task by title from DB
   */
  async deleteTaskByTitle(title: string): Promise<void> {
    const db = this.getDbConnection();
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE title = ?', [title], (err) => {
        db.close();
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
