import { Page, APIRequestContext } from '@playwright/test';
import { AuthApiClient } from '../clients/auth.api';
import { config } from '../../core/config/env.config';
import { Logger } from '../../core/utils/logger';

export class ApiHelper {
  /**
   * Bypass UI Login by calling Auth API and injecting localStorage state directly into browser page context
   */
  static async loginViaApi(
    page: Page,
    request: APIRequestContext,
    email = config.users.admin.email,
    password = config.users.admin.password
  ): Promise<string> {
    Logger.info(`Hybrid Helper: Fast logging in via API bypass for ${email}`);
    const authClient = new AuthApiClient(request);
    const { response, body } = await authClient.login(email, password);

    if (!response.ok()) {
      throw new Error(`API login bypass failed: ${response.status()} - ${JSON.stringify(body)}`);
    }

    const token = body.token;
    const user = body.user;

    // Navigate to root domain to set origin context
    await page.goto(config.baseUrl);

    // Inject token & user details directly into localStorage
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { token, user }
    );

    // Reload page to trigger application authenticated state
    await page.reload();
    return token;
  }
}
