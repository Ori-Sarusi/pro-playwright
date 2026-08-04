import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { BasePage } from '../../pages/base.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { TaskModalPage } from '../../pages/taskModal.page';
import { TasksApiHelper } from '../../api/tasks.api';

// Define custom fixture types
export type CustomFixtures = {
  loginPage: LoginPage;
  basePage: BasePage;
  dashboardPage: DashboardPage;
  taskModalPage: TaskModalPage;
  tasksApi: TasksApiHelper;
};

// Extend default Playwright test fixture
export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  taskModalPage: async ({ page }, use) => {
    await use(new TaskModalPage(page));
  },

  tasksApi: async ({ request }, use) => {
    await use(new TasksApiHelper(request));
  }
});

export { expect } from '@playwright/test';
