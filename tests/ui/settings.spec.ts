import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Settings Suite @settings', () => {

  test.beforeEach(async ({ loginPage, settingsPage }) => {
    // Authenticate and navigate to Settings view
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await settingsPage.navigateTo('settings');
    await settingsPage.verifySettingsPageLoaded();
  });

  // ═══════════════════════════════════════════════════════════
  // PROFILE SETTINGS
  // ═══════════════════════════════════════════════════════════

  test('Settings page pre-fills display name and email of logged-in user on load', async ({ settingsPage }) => {
    await expect(settingsPage.displayNameInput).toHaveValue(config.users.admin.name);
    await expect(settingsPage.emailInput).toHaveValue(config.users.admin.email);
  });

  test('Updating profile email allows user to login with new email credentials after logout', async ({ loginPage, settingsPage, basePage }) => {
    const newEmail = `updated_admin_${Date.now()}@taskflow.com`;
    const newName = 'Updated Admin';

    // 1. Update Profile (Name & Email)
    await settingsPage.updateProfile(newName, newEmail);
    await settingsPage.expectToastMessage('Profile saved');

    // 2. Verify sidebar user badge updates immediately
    await basePage.verifyUserBadge(newName, config.users.admin.role);

    // 3. Logout
    await basePage.logout();
    await expect(loginPage.authView).toBeVisible();

    // 4. Login with newly updated email & existing password
    await loginPage.login(newEmail, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();
    await basePage.verifyUserBadge(newName, config.users.admin.role);

    // 5. Teardown: Restore original Admin profile details to preserve test isolation
    await settingsPage.navigateTo('settings');
    await settingsPage.verifySettingsPageLoaded();
    await settingsPage.updateProfile(config.users.admin.name, config.users.admin.email);
    await settingsPage.expectToastMessage('Profile saved');
  });

  // ═══════════════════════════════════════════════════════════
  // PREFERENCES (DARK MODE & DESKTOP NOTIFICATIONS)
  // ═══════════════════════════════════════════════════════════

  test('Toggling Dark Mode shows toast confirmation', async ({ settingsPage }) => {
    // Toggle off
    await settingsPage.setDarkMode(false);
    await settingsPage.expectToastMessage('Light mode enabled');

    // Toggle on
    await settingsPage.setDarkMode(true);
    await settingsPage.expectToastMessage('Dark mode enabled');
  });

  test('Desktop notifications toggle state can be modified', async ({ settingsPage }) => {
    await settingsPage.setDesktopNotifications(true);
    await expect(settingsPage.desktopNotificationsToggle).toBeChecked();

    await settingsPage.setDesktopNotifications(false);
    await expect(settingsPage.desktopNotificationsToggle).not.toBeChecked();
  });
});
