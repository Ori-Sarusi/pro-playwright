import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Task List — Filter Suite @filter', () => {

  test.beforeAll(async ({ tasksApi }) => {
    // 1. Authenticate via API & Clean DB slate
    await tasksApi.login();
    await tasksApi.deleteAllTasks();

    // 2. Seed exact, distinct task matrix (different status & priority combinations)
    await tasksApi.createTask({
      title: 'FilterTask_Todo_Critical',
      status: 'todo',
      priority: 'critical',
    });
    await tasksApi.createTask({
      title: 'FilterTask_Progress_High',
      status: 'in-progress',
      priority: 'high',
    });
    await tasksApi.createTask({
      title: 'FilterTask_Done_Low',
      status: 'done',
      priority: 'low',
    });
    await tasksApi.createTask({
      title: 'FilterTask_Todo_Medium',
      status: 'todo',
      priority: 'medium',
    });
  });

  test.beforeEach(async ({ loginPage, taskListPage }) => {
    // Navigate to Task List page
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();
  });

  // ═══════════════════════════════════════════════════════════
  // STATUS FILTER TESTS
  // ═══════════════════════════════════════════════════════════

  test('Filter by status "To-Do" displays only To-Do tasks', async ({ taskListPage }) => {
    await taskListPage.filterByStatus('todo');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(2);
    expect(visibleTitles).toContain('FilterTask_Todo_Critical');
    expect(visibleTitles).toContain('FilterTask_Todo_Medium');
    expect(visibleTitles).not.toContain('FilterTask_Progress_High');
    expect(visibleTitles).not.toContain('FilterTask_Done_Low');
  });

  test('Filter by status "In Progress" displays only In Progress tasks', async ({ taskListPage }) => {
    await taskListPage.filterByStatus('in-progress');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('FilterTask_Progress_High');
  });

  test('Filter by status "Done" displays only Done tasks', async ({ taskListPage }) => {
    await taskListPage.filterByStatus('done');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('FilterTask_Done_Low');
  });

  // ═══════════════════════════════════════════════════════════
  // PRIORITY FILTER TESTS
  // ═══════════════════════════════════════════════════════════

  test('Filter by priority "Critical" displays only Critical tasks', async ({ taskListPage }) => {
    await taskListPage.filterByPriority('critical');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('FilterTask_Todo_Critical');
  });

  test('Filter by priority "High" displays only High tasks', async ({ taskListPage }) => {
    await taskListPage.filterByPriority('high');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('FilterTask_Progress_High');
  });

  // ═══════════════════════════════════════════════════════════
  // COMBINED FILTER TESTS
  // ═══════════════════════════════════════════════════════════

  test('Combined filter (status "To-Do" + priority "Critical") displays matching intersection', async ({ taskListPage }) => {
    await taskListPage.filterByStatus('todo');
    await taskListPage.filterByPriority('critical');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('FilterTask_Todo_Critical');
  });

  test('Combined filter with zero matching tasks displays empty table', async ({ taskListPage }) => {
    // Status Done + Priority Critical (no task in our matrix has this combo)
    await taskListPage.filterByStatus('done');
    await taskListPage.filterByPriority('critical');

    await taskListPage.page.waitForTimeout(1000);
    const rowCount = await taskListPage.getTableRowCount();
    expect(rowCount).toBe(0);
  });

  test('Resetting filters back to "All" restores full task list', async ({ taskListPage }) => {
    // Apply filters
    await taskListPage.filterByStatus('todo');
    await taskListPage.filterByPriority('critical');
    await taskListPage.page.waitForTimeout(1000);
    expect(await taskListPage.getTableRowCount()).toBe(1);

    // Reset filters
    await taskListPage.filterByStatus('');
    await taskListPage.filterByPriority('');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(4);
  });
});
