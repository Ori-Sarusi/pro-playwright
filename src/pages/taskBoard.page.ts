import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * TaskBoardPage — represents the Kanban Task Board view
 */
export class TaskBoardPage extends BasePage {
  readonly boardContainer: Locator;

  // Columns
  readonly todoColumn: Locator;
  readonly inProgressColumn: Locator;
  readonly doneColumn: Locator;

  // Column counts
  readonly todoCount: Locator;
  readonly inProgressCount: Locator;
  readonly doneCount: Locator;

  // Cards containers
  readonly todoCardsContainer: Locator;
  readonly inProgressCardsContainer: Locator;
  readonly doneCardsContainer: Locator;

  constructor(page: Page) {
    super(page);

    this.boardContainer = page.getByTestId('board-container');

    // Column locators
    this.todoColumn = page.getByTestId('column-todo');
    this.inProgressColumn = page.getByTestId('column-in-progress');
    this.doneColumn = page.getByTestId('column-done');

    // Count badges
    this.todoCount = page.locator('#count-todo');
    this.inProgressCount = page.locator('#count-in-progress');
    this.doneCount = page.locator('#count-done');

    // Cards containers
    this.todoCardsContainer = page.getByTestId('cards-todo');
    this.inProgressCardsContainer = page.getByTestId('cards-in-progress');
    this.doneCardsContainer = page.getByTestId('cards-done');
  }

  // ─── Actions & Assertions ───────────────────────────────

  async verifyBoardLoaded(): Promise<void> {
    await expect(this.boardContainer).toBeVisible();
    await expect(this.todoColumn).toBeVisible();
    await expect(this.inProgressColumn).toBeVisible();
    await expect(this.doneColumn).toBeVisible();
    await expect(this.pageTitle).toHaveText('Task Board');
  }

  async getColumnCounts(): Promise<{ todo: number; inProgress: number; done: number }> {
    const todoText = await this.todoCount.textContent() || '0';
    const inProgressText = await this.inProgressCount.textContent() || '0';
    const doneText = await this.doneCount.textContent() || '0';

    return {
      todo: parseInt(todoText, 10),
      inProgress: parseInt(inProgressText, 10),
      done: parseInt(doneText, 10),
    };
  }

  getTaskCardLocator(title: string): Locator {
    return this.boardContainer.locator('.task-card', { hasText: title });
  }

  async clickTaskCardByTitle(title: string): Promise<void> {
    const card = this.getTaskCardLocator(title);
    await card.click();
  }

  async dragAndDropCard(title: string, targetStatus: 'todo' | 'in-progress' | 'done'): Promise<void> {
    const card = this.getTaskCardLocator(title);
    const targetColumn = this.page.getByTestId(`cards-${targetStatus}`);
    await card.dragTo(targetColumn, { targetPosition: { x: 20, y: 20 } });
  }
}
