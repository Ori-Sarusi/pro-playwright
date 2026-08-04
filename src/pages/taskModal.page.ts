import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export interface TaskFormData {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  dueDate?: string; // Format: YYYY-MM-DD
}

/**
 * TaskModalPage — handles the Create/Edit Task modal dialog
 */
export class TaskModalPage extends BasePage {
  readonly modalContainer: Locator;
  readonly modalTitle: Locator;
  readonly closeModalButton: Locator;
  readonly cancelButton: Locator;

  // Form Fields
  readonly taskForm: Locator;
  readonly titleInput: Locator;
  readonly descriptionInput: Locator;
  readonly statusSelect: Locator;
  readonly prioritySelect: Locator;
  readonly assigneeSelect: Locator;
  readonly dueDateInput: Locator;
  readonly saveTaskButton: Locator;

  constructor(page: Page) {
    super(page);

    this.modalContainer = page.getByTestId('task-modal');
    this.modalTitle = page.getByTestId('task-modal-title');
    this.closeModalButton = page.getByTestId('close-task-modal');
    this.cancelButton = page.getByTestId('cancel-task-btn');

    this.taskForm = page.getByTestId('task-form');
    this.titleInput = page.getByTestId('task-title-input');
    this.descriptionInput = page.getByTestId('task-description-input');
    this.statusSelect = page.getByTestId('task-status-select');
    this.prioritySelect = page.getByTestId('task-priority-select');
    this.assigneeSelect = page.getByTestId('task-assignee-select');
    this.dueDateInput = page.getByTestId('task-due-date-input');
    this.saveTaskButton = page.getByTestId('save-task-btn');
  }

  // ─── Modal Actions ───────────────────────────────────────

  async verifyModalVisible(expectedTitle = 'New Task'): Promise<void> {
    await expect(this.modalContainer).toBeVisible();
    await expect(this.modalTitle).toHaveText(expectedTitle);
  }

  async verifyModalHidden(): Promise<void> {
    await expect(this.modalContainer).toBeHidden();
  }

  async fillTaskForm(data: TaskFormData): Promise<void> {
    await this.titleInput.fill(data.title);
    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.status) {
      await this.statusSelect.selectOption(data.status);
    }
    if (data.priority) {
      await this.prioritySelect.selectOption(data.priority);
    }
    if (data.assigneeId) {
      await this.assigneeSelect.selectOption(data.assigneeId);
    }
    if (data.dueDate) {
      await this.dueDateInput.fill(data.dueDate);
    }
  }

  async submitTaskForm(): Promise<void> {
    await this.saveTaskButton.click();
    await this.verifyModalHidden();
  }

  /**
   * Complete flow: Fill form and submit
   */
  async createTask(data: TaskFormData): Promise<void> {
    await this.fillTaskForm(data);
    await this.submitTaskForm();
  }

  async closeModal(): Promise<void> {
    await this.closeModalButton.click();
    await this.verifyModalHidden();
  }
}
