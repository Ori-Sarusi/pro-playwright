import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { SessionPage } from '../../pages/session.page';
import { AuthApiClient } from '../../api/clients/auth.api';
import { TasksApiClient } from '../../api/clients/tasks.api';
import { DbHelper } from '../../database/db.helper';
import { DashboardPage } from '../../pages/dashboard.page';

// Define custom fixture types
export type CustomFixtures = {
  loginPage: LoginPage;
  sessionPage: SessionPage;
  dashboardPage: DashboardPage;
  authApi: AuthApiClient;
  tasksApi: TasksApiClient;
  dbHelper: DbHelper;
};

// Extend default Playwright test fixture
export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  sessionPage: async ({ page }, use) => {
    await use(new SessionPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  authApi: async ({ request }, use) => {
    await use(new AuthApiClient(request));
  },

  tasksApi: async ({ request }, use) => {
    await use(new TasksApiClient(request));
  },

  dbHelper: async ({ page }, use) => {
    await use(new DbHelper());
  },
});

export { expect } from '@playwright/test';
