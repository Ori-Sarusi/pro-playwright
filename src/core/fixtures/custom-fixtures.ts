import { test as base } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { BasePage } from '../../pages/base.page';

// Define custom fixture types
export type CustomFixtures = {
  loginPage: LoginPage;
  basePage: BasePage;
};

// Extend default Playwright test fixture
export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  }
});

export { expect } from '@playwright/test';
