import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * TaskListPage — Page Object for Task List table view
 * Handles searching, filtering, sorting, pagination, bulk selection, and row actions.
 */
export class TaskListPage extends BasePage {
  readonly listPageContainer: Locator;
  readonly listToolbar: Locator;

  // Search & Filters
  readonly searchInput: Locator;
  readonly statusFilterSelect: Locator;
  readonly priorityFilterSelect: Locator;

  // Table & Headers (Sortable)
  readonly tasksTable: Locator;
  readonly tasksTableBody: Locator;
  readonly selectAllCheckbox: Locator;
  readonly sortTitleHeader: Locator;
  readonly sortStatusHeader: Locator;
  readonly sortPriorityHeader: Locator;
  readonly sortDueDateHeader: Locator;

  // Pagination & Bulk Actions
  readonly paginationContainer: Locator;
  readonly bulkActionsBar: Locator;
  readonly selectedCountLabel: Locator;
  readonly bulkDeleteButton: Locator;

  constructor(page: Page) {
    super(page);

    this.listPageContainer = page.getByTestId('list-page');
    this.listToolbar = page.getByTestId('list-toolbar');

    // Search & Filters
    this.searchInput = page.getByTestId('search-input');
    this.statusFilterSelect = page.getByTestId('filter-status');
    this.priorityFilterSelect = page.getByTestId('filter-priority');

    // Table & Headers
    this.tasksTable = page.getByTestId('tasks-table');
    this.tasksTableBody = page.getByTestId('tasks-table-body');
    this.selectAllCheckbox = page.getByTestId('select-all-checkbox');
    this.sortTitleHeader = page.getByTestId('sort-title');
    this.sortStatusHeader = page.getByTestId('sort-status');
    this.sortPriorityHeader = page.getByTestId('sort-priority');
    this.sortDueDateHeader = page.getByTestId('sort-due-date');

    // Pagination & Bulk Actions
    this.paginationContainer = page.getByTestId('pagination');
    this.bulkActionsBar = page.getByTestId('bulk-actions');
    this.selectedCountLabel = page.getByTestId('selected-count');
    this.bulkDeleteButton = page.getByTestId('bulk-delete-btn');
  }

  // ─── Actions & Assertions ───────────────────────────────

  async verifyListPageLoaded(): Promise<void> {
    await expect(this.listPageContainer).toBeVisible();
    await expect(this.tasksTable).toBeVisible();
    await expect(this.pageTitle).toHaveText('Task List');
  }

  // ─── Search & Filters ───────────────────────────────────

  async searchTasks(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Debounce wait in app is 300ms
    await this.page.waitForTimeout(400);
  }

  async filterByStatus(status: '' | 'todo' | 'in-progress' | 'done'): Promise<void> {
    const responsePromise = this.page.waitForResponse(resp => resp.url().includes('/api/v1/tasks') && resp.status() === 200);
    await this.statusFilterSelect.selectOption(status);
    await responsePromise;
  }

  async filterByPriority(priority: '' | 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    const responsePromise = this.page.waitForResponse(resp => resp.url().includes('/api/v1/tasks') && resp.status() === 200);
    await this.priorityFilterSelect.selectOption(priority);
    await responsePromise;
  }

  // ─── Sorting ─────────────────────────────────────────────

  async sortByColumn(column: 'title' | 'status' | 'priority' | 'due_date'): Promise<void> {
    const headers = {
      title: this.sortTitleHeader,
      status: this.sortStatusHeader,
      priority: this.sortPriorityHeader,
      due_date: this.sortDueDateHeader,
    };
    const responsePromise = this.page.waitForResponse(resp => resp.url().includes('/api/v1/tasks') && resp.status() === 200);
    await headers[column].click();
    await responsePromise;
  }

  // ─── Table Rows & Text Extraction ───────────────────────

  getTaskRowLocator(taskId: number): Locator {
    return this.page.getByTestId(`task-row-${taskId}`);
  }

  async getTableTaskTitles(): Promise<string[]> {
    const titleLinks = this.tasksTableBody.locator('a[data-testid^="task-title-"]');
    const texts = await titleLinks.allTextContents();
    return texts.map(t => t.trim()).filter(Boolean);
  }

  async getTableRowCount(): Promise<number> {
    return await this.tasksTableBody.locator('tr').count();
  }

  // ─── Row Actions ────────────────────────────────────────

  async clickTaskTitleByText(title: string): Promise<void> {
    await this.tasksTableBody.locator('a[data-testid^="task-title-"]', { hasText: title }).click();
  }

  async editTaskById(taskId: number): Promise<void> {
    await this.page.getByTestId(`edit-task-${taskId}`).click();
  }

  async deleteTaskById(taskId: number): Promise<void> {
    await this.page.getByTestId(`delete-task-${taskId}`).click();
    // Confirm delete in modal dialog
    await this.page.getByTestId('confirm-delete-btn').click();
  }

  // ─── Checkboxes & Bulk Actions ──────────────────────────

  async selectTaskCheckbox(taskId: number): Promise<void> {
    await this.page.getByTestId(`task-checkbox-${taskId}`).check();
  }

  async toggleSelectAll(): Promise<void> {
    await this.selectAllCheckbox.click();
  }

  async executeBulkDelete(): Promise<void> {
    await expect(this.bulkActionsBar).toBeVisible();
    await this.bulkDeleteButton.click();
  }

  // ─── Pagination ─────────────────────────────────────────

  async goToPage(pageNumber: number): Promise<void> {
    const pageBtn = this.paginationContainer.getByTestId(`page-${pageNumber}`);
    await pageBtn.click();
  }
}
