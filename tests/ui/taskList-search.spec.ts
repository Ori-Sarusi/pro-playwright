import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Task List — Search Suite @search', () => {

  test.beforeAll(async ({ tasksApi }) => {
    // 1. Authenticate via API & Clean DB slate
    await tasksApi.login();
    await tasksApi.deleteAllTasks();

    // 2. Seed specific test tasks via API
    await tasksApi.createTask({
      title: 'AlphaSearchTask',
      description: 'First test task for search validation',
      status: 'todo',
      priority: 'high',
    });
    await tasksApi.createTask({
      title: 'BetaSearchTask',
      description: 'Contains specialkeyword in description body',
      status: 'in-progress',
      priority: 'medium',
    });
    await tasksApi.createTask({
      title: 'GammaOtherTask',
      description: 'Standard description text without key terms',
      status: 'done',
      priority: 'low',
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
  // SEARCH TESTS
  // ═══════════════════════════════════════════════════════════

  test('Search exact title match returns only the matching task', async ({ taskListPage }) => {
    await taskListPage.searchTasks('AlphaSearchTask');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('AlphaSearchTask');
  });

  test('Search partial keyword match returns all matching tasks', async ({ taskListPage }) => {
    await taskListPage.searchTasks('SearchTask');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(2);
    expect(visibleTitles).toContain('AlphaSearchTask');
    expect(visibleTitles).toContain('BetaSearchTask');
    expect(visibleTitles).not.toContain('GammaOtherTask');
  });

  test('Search is case-insensitive', async ({ taskListPage }) => {
    await taskListPage.searchTasks('aLpHa');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('AlphaSearchTask');
  });

  test('Search matches text inside task description', async ({ taskListPage }) => {
    await taskListPage.searchTasks('specialkeyword');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('BetaSearchTask');
  });

  test('Search with non-existent query displays zero table rows', async ({ taskListPage }) => {
    await taskListPage.searchTasks('NonExistentQuery999');

    const rowCount = await taskListPage.getTableRowCount();
    expect(rowCount).toBe(0);
  });

  test('Clearing search input restores all seeded tasks to table', async ({ taskListPage }) => {
    // Search first to filter table
    await taskListPage.searchTasks('AlphaSearchTask');
    expect(await taskListPage.getTableRowCount()).toBe(1);

    // Clear search
    await taskListPage.searchTasks('');

    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(3);
    expect(visibleTitles).toContain('AlphaSearchTask');
    expect(visibleTitles).toContain('BetaSearchTask');
    expect(visibleTitles).toContain('GammaOtherTask');
  });

  test('Searching from page 1 finds a task located on page 2 (multi-page dataset)', async ({ loginPage, taskListPage, tasksApi }) => {
    // Seed 10 additional dummy tasks so total count exceeds page size limit of 10 (total 13 tasks)
    for (let i = 1; i <= 10; i++) {
      await tasksApi.createTask({
        title: `FillerTask_${i}`,
        status: 'todo',
      });
    }

    // Re-login to load updated dataset and pagination state
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Verify pagination controls exist and page 2 button is present
    await expect(taskListPage.paginationContainer.getByTestId('page-2')).toBeVisible();

    // Search for a task that is currently pushed to page 2 (e.g. GammaOtherTask) while sitting on Page 1
    await taskListPage.searchTasks('GammaOtherTask');

    // Verify the search pulls the target task onto page 1 results table
    const visibleTitles = await taskListPage.getTableTaskTitles();
    expect(visibleTitles).toHaveLength(1);
    expect(visibleTitles[0]).toBe('GammaOtherTask');
  });
});
