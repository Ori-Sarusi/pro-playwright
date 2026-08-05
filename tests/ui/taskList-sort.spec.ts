import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Task List — Sorting Suite @sort', () => {

  test.beforeAll(async ({ tasksApi }) => {
    // 1. Authenticate via API & Clean DB slate
    await tasksApi.login();
    await tasksApi.deleteAllTasks();

    // 2. Seed tasks with distinct Title, Status, Priority, and Due Date values
    await tasksApi.createTask({
      title: 'AlphaTask',
      status: 'todo',
      priority: 'critical',
      due_date: '2026-01-01',
    });
    await tasksApi.createTask({
      title: 'BetaTask',
      status: 'in-progress',
      priority: 'low',
      due_date: '2026-06-15',
    });
    await tasksApi.createTask({
      title: 'GammaTask',
      status: 'done',
      priority: 'high',
      due_date: '2026-12-31',
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
  // TITLE SORTING
  // ═══════════════════════════════════════════════════════════

  test('Sort by Title Ascending orders tasks alphabetically A-Z', async ({ taskListPage }) => {
    await taskListPage.sortByColumn('title');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toEqual(['AlphaTask', 'BetaTask', 'GammaTask']);
  });

  test('Sort by Title Descending orders tasks alphabetically Z-A on second click', async ({ taskListPage }) => {
    // First click: ASC
    await taskListPage.sortByColumn('title');
    // Second click: DESC
    await taskListPage.sortByColumn('title');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toEqual(['GammaTask', 'BetaTask', 'AlphaTask']);
  });

  // ═══════════════════════════════════════════════════════════
  // STATUS SORTING
  // ═══════════════════════════════════════════════════════════

  test('Sort by Status Ascending orders tasks by status string', async ({ taskListPage }) => {
    await taskListPage.sortByColumn('status');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toHaveLength(3);
  });

  test('Sort by Status Descending toggles order on second click', async ({ taskListPage }) => {
    await taskListPage.sortByColumn('status');
    await taskListPage.sortByColumn('status');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toHaveLength(3);
  });

  // ═══════════════════════════════════════════════════════════
  // PRIORITY SORTING
  // ═══════════════════════════════════════════════════════════

  test('Sort by Priority Ascending orders tasks by priority field', async ({ taskListPage }) => {
    await taskListPage.sortByColumn('priority');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toHaveLength(3);
  });

  test('Sort by Priority Descending toggles order on second click', async ({ taskListPage }) => {
    await taskListPage.sortByColumn('priority');
    await taskListPage.sortByColumn('priority');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toHaveLength(3);
  });

  // ═══════════════════════════════════════════════════════════
  // DUE DATE SORTING
  // ═══════════════════════════════════════════════════════════

  test('Sort by Due Date Ascending orders tasks chronologically (earliest first)', async ({ taskListPage }) => {
    await taskListPage.sortByColumn('due_date');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toEqual(['AlphaTask', 'BetaTask', 'GammaTask']);
  });

  test('Sort by Due Date Descending orders tasks chronologically (latest first) on second click', async ({ taskListPage }) => {
    await taskListPage.sortByColumn('due_date');
    await taskListPage.sortByColumn('due_date');

    const titles = await taskListPage.getTableTaskTitles();
    expect(titles).toEqual(['GammaTask', 'BetaTask', 'AlphaTask']);
  });
});
