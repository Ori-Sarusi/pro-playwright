import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * DashboardPage — represents the Dashboard view and stats
 */
export class DashboardPage extends BasePage {
  readonly dashboardView: Locator;
  readonly statsGrid: Locator;
  readonly statTotalCount: Locator;
  readonly statTodoCount: Locator;
  readonly statInProgressCount: Locator;
  readonly statDoneCount: Locator;
  readonly statOverdueCount: Locator;

  readonly recentTasksSection: Locator;
  readonly recentTasksList: Locator;
  readonly recentTaskItems: Locator;

  constructor(page: Page) {
    super(page);

    this.dashboardView = page.getByTestId('dashboard-page');
    this.statsGrid = page.getByTestId('stats-grid');

    // Stat cards & counts
    this.statTotalCount = page.locator('#stat-total');
    this.statTodoCount = page.locator('#stat-todo');
    this.statInProgressCount = page.locator('#stat-in-progress');
    this.statDoneCount = page.locator('#stat-done');
    this.statOverdueCount = page.locator('#stat-overdue');

    // Recent tasks
    this.recentTasksSection = page.locator('.recent-section');
    this.recentTasksList = page.getByTestId('recent-tasks-list');
    this.recentTaskItems = page.locator('.recent-task-item');
  }

  // ─── Actions & Navigations ─────────────────────────────

  async verifyDashboardLoaded(): Promise<void> {
    await expect(this.dashboardView).toBeVisible();
    await expect(this.statsGrid).toBeVisible();
    await expect(this.pageTitle).toHaveText('Dashboard');
  }

  async getStatValues(): Promise<{ total: number; todo: number; inProgress: number; done: number; overdue: number }> {
    const totalText = await this.statTotalCount.textContent() || '0';
    const todoText = await this.statTodoCount.textContent() || '0';
    const inProgressText = await this.statInProgressCount.textContent() || '0';
    const doneText = await this.statDoneCount.textContent() || '0';
    const overdueText = await this.statOverdueCount.textContent() || '0';

    return {
      total: parseInt(totalText, 10),
      todo: parseInt(todoText, 10),
      inProgress: parseInt(inProgressText, 10),
      done: parseInt(doneText, 10),
      overdue: parseInt(overdueText, 10),
    };
  }

  async clickRecentTaskByTitle(title: string): Promise<void> {
    const taskItem = this.recentTaskItems.filter({ hasText: title });
    await taskItem.click();
  }

  async getRecentTaskCount(): Promise<number> {
    return await this.recentTaskItems.count();
  }
}
