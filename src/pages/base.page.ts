import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — shared app shell elements (NavBar, New Task, Toast, User Badge)
 * All authenticated pages inherit from this.
 */
export class BasePage {
  readonly page: Page;

  // App Shell
  readonly appShell: Locator;

  // Sidebar Navigation
  readonly sidebar: Locator;
  readonly navDashboard: Locator;
  readonly navBoard: Locator;
  readonly navList: Locator;
  readonly navUsers: Locator;
  readonly navSettings: Locator;

  // Top Bar
  readonly pageTitle: Locator;
  readonly createTaskButton: Locator;

  // User Badge
  readonly userNameLabel: Locator;
  readonly userRoleLabel: Locator;
  readonly logoutButton: Locator;

  // Toast
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;

    // App Shell
    this.appShell = page.getByTestId('app-shell');

    // Sidebar Navigation
    this.sidebar = page.getByTestId('sidebar');
    this.navDashboard = page.getByTestId('nav-dashboard');
    this.navBoard = page.getByTestId('nav-board');
    this.navList = page.getByTestId('nav-list');
    this.navUsers = page.getByTestId('nav-users');
    this.navSettings = page.getByTestId('nav-settings');

    // Top Bar
    this.pageTitle = page.getByTestId('page-title');
    this.createTaskButton = page.getByTestId('create-task-btn');

    // User Badge
    this.userNameLabel = page.getByTestId('user-name');
    this.userRoleLabel = page.getByTestId('user-role');
    this.logoutButton = page.getByTestId('logout-btn');

    // Toast
    this.toast = page.getByTestId('toast-notification');
  }

  // ─── Navigation ─────────────────────────────────────────

  async navigateTo(page: 'dashboard' | 'board' | 'list' | 'users' | 'settings'): Promise<void> {
    const navMap = {
      dashboard: this.navDashboard,
      board: this.navBoard,
      list: this.navList,
      users: this.navUsers,
      settings: this.navSettings,
    };
    await navMap[page].click();
  }

  async verifyPageTitle(expectedTitle: string): Promise<void> {
    await expect(this.pageTitle).toHaveText(expectedTitle);
  }

  // ─── New Task ───────────────────────────────────────────

  async clickNewTask(): Promise<void> {
    await this.createTaskButton.click();
  }

  // ─── User Badge ─────────────────────────────────────────

  async verifyUserBadge(name: string, role: string): Promise<void> {
    await expect(this.userNameLabel).toHaveText(name);
    await expect(this.userRoleLabel).toHaveText(role);
  }

  // ─── Toast ──────────────────────────────────────────────

  async expectToastMessage(expectedText: string): Promise<void> {
    await expect(this.toast).toContainText(expectedText, { timeout: 5000 });
  }

  // ─── Logout ─────────────────────────────────────────────

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
