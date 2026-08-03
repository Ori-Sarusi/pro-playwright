import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — shared helpers for all Page Objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Expect a toast notification with given text
   */
  async expectToastMessage(expectedText: string): Promise<void> {
    const toast = this.page.getByTestId('toast-notification');
    await expect(toast).toContainText(expectedText, { timeout: 5000 });
  }
}
