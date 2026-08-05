import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * SettingsPage — represents the Settings view (Profile & Preferences)
 */
export class SettingsPage extends BasePage {
  readonly settingsPageContainer: Locator;

  // Profile Settings
  readonly displayNameInput: Locator;
  readonly emailInput: Locator;
  readonly saveProfileButton: Locator;

  // Preferences Toggles
  readonly darkModeToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly desktopNotificationsToggle: Locator;

  constructor(page: Page) {
    super(page);

    this.settingsPageContainer = page.getByTestId('settings-page');

    // Profile Settings
    this.displayNameInput = page.getByTestId('settings-name-input');
    this.emailInput = page.getByTestId('settings-email-input');
    this.saveProfileButton = page.getByTestId('save-profile-btn');

    // Preferences Toggles
    this.darkModeToggle = page.getByTestId('dark-mode-toggle');
    this.emailNotificationsToggle = page.getByTestId('email-notifications-toggle');
    this.desktopNotificationsToggle = page.getByTestId('desktop-notifications-toggle');
  }

  // ─── Actions & Assertions ───────────────────────────────

  async verifySettingsPageLoaded(): Promise<void> {
    await expect(this.settingsPageContainer).toBeVisible();
    await expect(this.displayNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.pageTitle).toHaveText('Settings');
  }

  async updateProfile(name: string, email: string): Promise<void> {
    await this.displayNameInput.fill(name);
    await this.emailInput.fill(email);
    await this.saveProfileButton.click();
  }

  async setDarkMode(enabled: boolean): Promise<void> {
    const isChecked = await this.darkModeToggle.isChecked();
    if (isChecked !== enabled) {
      await this.darkModeToggle.click();
    }
  }

  async setEmailNotifications(enabled: boolean): Promise<void> {
    const isChecked = await this.emailNotificationsToggle.isChecked();
    if (isChecked !== enabled) {
      await this.emailNotificationsToggle.click();
    }
  }

  async setDesktopNotifications(enabled: boolean): Promise<void> {
    const isChecked = await this.desktopNotificationsToggle.isChecked();
    if (isChecked !== enabled) {
      await this.desktopNotificationsToggle.click();
    }
  }
}
