import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * DashboardPage — dashboard stats and recent tasks
 */
export class DashboardPage extends BasePage {
  readonly appShell: Locator;
  readonly statsGrid: Locator;
  readonly statTotal: Locator;
  readonly statTodo: Locator;
  readonly statInProgress: Locator;
  readonly statDone: Locator;
  readonly statOverdue: Locator;
  readonly recentTasksList: Locator;
  readonly pageTitle: Locator;
  readonly userNameBadge: Locator;
  readonly userRoleBadge: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.appShell = page.getByTestId('app-shell');
    this.statsGrid = page.getByTestId('stats-grid');
    this.statTotal = page.getByTestId('stat-total');
    this.statTodo = page.getByTestId('stat-todo');
    this.statInProgress = page.getByTestId('stat-in-progress');
    this.statDone = page.getByTestId('stat-done');
    this.statOverdue = page.getByTestId('stat-overdue');
    this.recentTasksList = page.getByTestId('recent-tasks-list');
    this.pageTitle = page.getByTestId('page-title');
    this.userNameBadge = page.getByTestId('user-name');
    this.userRoleBadge = page.getByTestId('user-role');
    this.logoutButton = page.getByTestId('logout-btn');
  }

  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.appShell).toBeVisible();
    await expect(this.statsGrid).toBeVisible();
    await expect(this.pageTitle).toHaveText('Dashboard');
  }

  async getStatValues(): Promise<{ total: string; todo: string; inProgress: string; done: string; overdue: string }> {
    return {
      total: await this.statTotal.locator('.stat-value').textContent() || '0',
      todo: await this.statTodo.locator('.stat-value').textContent() || '0',
      inProgress: await this.statInProgress.locator('.stat-value').textContent() || '0',
      done: await this.statDone.locator('.stat-value').textContent() || '0',
      overdue: await this.statOverdue.locator('.stat-value').textContent() || '0',
    };
  }

  async verifyStatsAreNonZero(): Promise<void> {
    await expect(this.statTotal.locator('.stat-value')).not.toHaveText('0');
  }

  async verifyRecentTasksVisible(): Promise<void> {
    await expect(this.recentTasksList).toBeVisible();
    const items = this.recentTasksList.locator('.recent-task-item');
    await expect(items.first()).toBeVisible();
  }

  async verifyUserBadge(name: string, role: string): Promise<void> {
    await expect(this.userNameBadge).toHaveText(name);
    await expect(this.userRoleBadge).toHaveText(role);
  }

  async navigateTo(page: 'dashboard' | 'board' | 'list' | 'users' | 'settings'): Promise<void> {
    await this.page.getByTestId(`nav-${page}`).click();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
