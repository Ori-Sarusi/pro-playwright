import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { BasePage } from '../../pages/base.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { TaskBoardPage } from '../../pages/taskBoard.page';
import { TaskListPage } from '../../pages/taskList.page';
import { SettingsPage } from '../../pages/settings.page';
import { TaskModalPage } from '../../pages/taskModal.page';
import { TasksApiHelper } from '../../api/tasks.api';

// Define custom fixture types
export type CustomFixtures = {
  loginPage: LoginPage;
  basePage: BasePage;
  dashboardPage: DashboardPage;
  taskBoardPage: TaskBoardPage;
  taskListPage: TaskListPage;
  settingsPage: SettingsPage;
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

  taskBoardPage: async ({ page }, use) => {
    await use(new TaskBoardPage(page));
  },

  taskListPage: async ({ page }, use) => {
    await use(new TaskListPage(page));
  },

  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },

  taskModalPage: async ({ page }, use) => {
    await use(new TaskModalPage(page));
  },

  tasksApi: async ({ request }, use) => {
    await use(new TasksApiHelper(request));
  }
});

export { expect } from '@playwright/test';
