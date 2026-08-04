import { APIRequestContext, request } from '@playwright/test';
import { config } from '../core/config/env.config';

export interface CreateTaskApiParams {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee_id?: number | null;
  due_date?: string | null;
  tags?: string[];
}

export interface TaskApiResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: number | null;
  due_date: string | null;
  tags: string;
  created_by: number;
}

/**
 * TasksApiHelper — handles task creation, updates, and cleanup via REST API for test setup/teardown
 */
export class TasksApiHelper {
  private requestContext: APIRequestContext;
  private authToken: string | null = null;

  constructor(requestContext: APIRequestContext) {
    this.requestContext = requestContext;
  }

  /**
   * Authenticate via API to get JWT token
   */
  async login(email = config.users.admin.email, password = config.users.admin.password): Promise<string> {
    const response = await this.requestContext.post(`${config.baseUrl}/api/v1/auth/login`, {
      data: { email, password },
    });
    if (!response.ok()) {
      throw new Error(`API login failed with status ${response.status()}`);
    }
    const body = await response.json();
    this.authToken = body.token;
    return this.authToken!;
  }

  private getHeaders() {
    if (!this.authToken) {
      throw new Error('Must call login() on TasksApiHelper before making authenticated API requests.');
    }
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a single task via API
   */
  async createTask(params: CreateTaskApiParams): Promise<TaskApiResponse> {
    if (!this.authToken) await this.login();

    const response = await this.requestContext.post(`${config.baseUrl}/api/v1/tasks`, {
      headers: this.getHeaders(),
      data: params,
    });
    if (!response.ok()) {
      throw new Error(`Failed to create task via API: ${response.statusText()}`);
    }
    return await response.json();
  }

  /**
   * Update a task via API
   */
  async updateTask(taskId: number, updates: Partial<CreateTaskApiParams>): Promise<TaskApiResponse> {
    if (!this.authToken) await this.login();

    const response = await this.requestContext.put(`${config.baseUrl}/api/v1/tasks/${taskId}`, {
      headers: this.getHeaders(),
      data: updates,
    });
    if (!response.ok()) {
      throw new Error(`Failed to update task ${taskId} via API: ${response.statusText()}`);
    }
    return await response.json();
  }

  /**
   * Delete a task by ID via API
   */
  async deleteTask(taskId: number): Promise<void> {
    if (!this.authToken) await this.login();

    const response = await this.requestContext.delete(`${config.baseUrl}/api/v1/tasks/${taskId}`, {
      headers: this.getHeaders(),
    });
    if (!response.ok()) {
      throw new Error(`Failed to delete task ${taskId} via API: ${response.statusText()}`);
    }
  }

  /**
   * Delete multiple tasks by ID array (cleanup helper for afterEach/afterAll)
   */
  async deleteTasks(taskIds: number[]): Promise<void> {
    for (const id of taskIds) {
      try {
        await this.deleteTask(id);
      } catch (err) {
        console.warn(`Could not delete task ID ${id}:`, err);
      }
    }
  }
}
