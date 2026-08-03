import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '../../core/config/env.config';
import { Logger } from '../../core/utils/logger';

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
}

export class TasksApiClient {
  constructor(private request: APIRequestContext) {}

  private getAuthHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async getAllTasks(token: string, status?: string): Promise<{ response: APIResponse; body: any }> {
    Logger.info(`API Client: Fetching all tasks ${status ? `with status filter: ${status}` : ''}`);
    const url = status ? `${config.apiUrl}/tasks?status=${status}` : `${config.apiUrl}/tasks`;
    const response = await this.request.get(url, {
      headers: this.getAuthHeader(token)
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  }

  async getTaskById(token: string, id: number): Promise<{ response: APIResponse; body: any }> {
    Logger.info(`API Client: Fetching task ID #${id}`);
    const response = await this.request.get(`${config.apiUrl}/tasks/${id}`, {
      headers: this.getAuthHeader(token)
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  }

  async createTask(token: string, payload: CreateTaskPayload): Promise<{ response: APIResponse; body: any }> {
    Logger.info(`API Client: Creating task via REST API "${payload.title}"`);
    const response = await this.request.post(`${config.apiUrl}/tasks`, {
      headers: this.getAuthHeader(token),
      data: payload
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  }

  async updateTask(token: string, id: number, payload: Partial<CreateTaskPayload>): Promise<{ response: APIResponse; body: any }> {
    Logger.info(`API Client: Updating task ID #${id}`);
    const response = await this.request.put(`${config.apiUrl}/tasks/${id}`, {
      headers: this.getAuthHeader(token),
      data: payload
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  }

  async deleteTask(token: string, id: number): Promise<{ response: APIResponse; body: any }> {
    Logger.info(`API Client: Deleting task ID #${id}`);
    const response = await this.request.delete(`${config.apiUrl}/tasks/${id}`, {
      headers: this.getAuthHeader(token)
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  }
}
