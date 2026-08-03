import { APIRequestContext, APIResponse } from '@playwright/test';
import { config } from '../../core/config/env.config';
import { Logger } from '../../core/utils/logger';

export class AuthApiClient {
  constructor(private request: APIRequestContext) {}

  /**
   * Send POST login request
   */
  async login(email = config.users.admin.email, password = config.users.admin.password): Promise<{ response: APIResponse; body: any }> {
    Logger.info(`API Client: Logging in via REST API with email: ${email}`);
    const response = await this.request.post(`${config.apiUrl}/auth/login`, {
      data: { email, password }
    });
    const body = await response.json().catch(() => ({}));
    return { response, body };
  }

  /**
   * Helper to retrieve raw JWT token directly from API
   */
  async getAuthToken(email = config.users.admin.email, password = config.users.admin.password): Promise<string> {
    const { response, body } = await this.login(email, password);
    if (!response.ok()) {
      throw new Error(`API Login failed with status ${response.status()}: ${JSON.stringify(body)}`);
    }
    return body.token;
  }
}
