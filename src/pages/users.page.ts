import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * UsersPage — Page Object for Users Management view
 */
export class UsersPage extends BasePage {
  readonly usersPageContainer: Locator;
  readonly usersTable: Locator;
  readonly usersTableBody: Locator;

  constructor(page: Page) {
    super(page);

    this.usersPageContainer = page.getByTestId('users-page');
    this.usersTable = page.getByTestId('users-table');
    this.usersTableBody = page.getByTestId('users-table-body');
  }

  // ─── Actions & Assertions ───────────────────────────────

  async verifyUsersPageLoaded(): Promise<void> {
    await expect(this.usersPageContainer).toBeVisible();
    await expect(this.usersTable).toBeVisible();
    await expect(this.pageTitle).toHaveText('Users');
  }

  getUserRowLocator(userId: number): Locator {
    return this.page.getByTestId(`user-row-${userId}`);
  }

  async changeUserRole(userId: number, newRole: 'admin' | 'manager' | 'member'): Promise<void> {
    const roleSelect = this.page.getByTestId(`user-role-select-${userId}`);
    await roleSelect.selectOption(newRole);
  }

  async changeUserRoleByName(name: string, newRole: 'admin' | 'manager' | 'member'): Promise<void> {
    const userRow = this.usersTableBody.locator('tr', { hasText: name });
    const roleSelect = userRow.locator('select');
    await roleSelect.selectOption(newRole);
  }

  async deleteUserById(userId: number): Promise<void> {
    await this.page.getByTestId(`delete-user-${userId}`).click();
    await this.page.getByTestId('confirm-delete-btn').click();
  }
}
