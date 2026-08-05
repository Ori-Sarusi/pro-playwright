import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Task List — Row Actions & Checkboxes Suite @actions', () => {

  test.beforeEach(async ({ loginPage, taskListPage, tasksApi }) => {
    // 1. Authenticate via API & Clean DB slate
    await tasksApi.login();
    await tasksApi.deleteAllTasks();

    // 2. Authenticate via UI & Navigate to Task List page
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();
  });

  // ═══════════════════════════════════════════════════════════
  // EDIT TASK BUTTON & MODAL VALIDATION
  // ═══════════════════════════════════════════════════════════

  test('Clicking Edit button opens modal pre-filled with task details', async ({ loginPage, taskListPage, taskModalPage, tasksApi }) => {
    // Pre-condition: Create task via API
    const task = await tasksApi.createTask({
      title: 'TaskToEdit_01',
      description: 'Original description text',
      status: 'todo',
      priority: 'high',
    });

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Click Edit button ✏️ on row
    await taskListPage.editTaskById(task.id);
    await taskModalPage.verifyModalVisible('Edit Task');

    // Validate pre-filled content in modal
    await expect(taskModalPage.titleInput).toHaveValue('TaskToEdit_01');
    await expect(taskModalPage.descriptionInput).toHaveValue('Original description text');
    await expect(taskModalPage.statusSelect).toHaveValue('todo');
    await expect(taskModalPage.prioritySelect).toHaveValue('high');
  });

  test('Editing a task updates its content in the table and opens modal with updated content', async ({ loginPage, taskListPage, taskModalPage, tasksApi }) => {
    // Pre-condition: Create task via API
    const task = await tasksApi.createTask({
      title: 'OriginalTitle',
      description: 'Original text',
      status: 'todo',
      priority: 'low',
    });

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Open Edit modal
    await taskListPage.editTaskById(task.id);
    await taskModalPage.verifyModalVisible('Edit Task');

    // Update form fields to new content
    const updatedTitle = `UpdatedTitle_${Date.now()}`;
    await taskModalPage.fillTaskForm({
      title: updatedTitle,
      description: 'Updated description text',
      status: 'done',
      priority: 'critical',
    });
    await taskModalPage.submitTaskForm();

    // Verify Toast notification
    await taskListPage.expectToastMessage('Task updated');

    // Validate table displays new updated title and status badge
    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toContain(updatedTitle);
    expect(visibleTitles).not.toContain('OriginalTitle');

    // Re-open Edit modal to validate persisted new content
    await taskListPage.editTaskById(task.id);
    await expect(taskModalPage.titleInput).toHaveValue(updatedTitle);
    await expect(taskModalPage.descriptionInput).toHaveValue('Updated description text');
    await expect(taskModalPage.statusSelect).toHaveValue('done');
    await expect(taskModalPage.prioritySelect).toHaveValue('critical');
  });

  // ═══════════════════════════════════════════════════════════
  // DELETE TASK BUTTON & CONFIRMATION DIALOG
  // ═══════════════════════════════════════════════════════════

  test('Clicking Delete button on a row removes task after confirming modal dialog', async ({ loginPage, taskListPage, tasksApi }) => {
    // Pre-condition: Create task via API
    const task = await tasksApi.createTask({
      title: 'TaskToDelete_01',
      status: 'todo',
    });

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Click Delete 🗑️ button on row
    await taskListPage.deleteTaskById(task.id);

    // Verify Toast notification
    await taskListPage.expectToastMessage('Task deleted');

    // Verify row is removed from table
    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).not.toContain('TaskToDelete_01');
  });

  // ═══════════════════════════════════════════════════════════
  // CHECKBOXES & BULK ACTIONS
  // ═══════════════════════════════════════════════════════════

  test('Checking a task row checkbox activates floating bulk bar with "1 selected"', async ({ loginPage, taskListPage, tasksApi }) => {
    const task = await tasksApi.createTask({ title: 'CheckboxTask_01', status: 'todo' });

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Check single row checkbox
    await taskListPage.selectTaskCheckbox(task.id);

    // Verify floating bulk actions bar appears showing "1 selected"
    await expect(taskListPage.bulkActionsBar).toBeVisible();
    await expect(taskListPage.selectedCountLabel).toHaveText('1 selected');
  });

  test('Checking "Select All" checkbox selects all visible rows and updates floating count', async ({ loginPage, taskListPage, tasksApi }) => {
    // Pre-condition: Create 3 tasks
    await tasksApi.createTask({ title: 'BulkTask_1', status: 'todo' });
    await tasksApi.createTask({ title: 'BulkTask_2', status: 'todo' });
    await tasksApi.createTask({ title: 'BulkTask_3', status: 'todo' });

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Toggle Select All checkbox in table header
    await taskListPage.toggleSelectAll();

    // Verify bulk actions bar shows "3 selected"
    await expect(taskListPage.bulkActionsBar).toBeVisible();
    await expect(taskListPage.selectedCountLabel).toHaveText('3 selected');
  });

  test('Executing Bulk Delete removes all selected tasks from table', async ({ loginPage, taskListPage, tasksApi }) => {
    // Pre-condition: Create 2 tasks
    await tasksApi.createTask({ title: 'BulkDelete_A', status: 'todo' });
    await tasksApi.createTask({ title: 'BulkDelete_B', status: 'todo' });

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Select all rows and click Bulk Delete
    await taskListPage.toggleSelectAll();
    await taskListPage.executeBulkDelete();

    // Verify Toast confirmation
    await taskListPage.expectToastMessage('Deleted 2 tasks');

    // Verify table is empty
    expect(await taskListPage.getTableRowCount()).toBe(0);
  });
});
