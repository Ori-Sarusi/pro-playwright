import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Dashboard Tests @dashboard', () => {
  test.describe.configure({ mode: 'serial' });
  let createdTaskIds: number[] = [];

  test.beforeEach(async ({ loginPage, dashboardPage }) => {
    // Authenticate and ensure Dashboard view is loaded
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await dashboardPage.verifyDashboardLoaded();
  });

  test.afterEach(async ({ tasksApi }) => {
    // Teardown: Clean up any tasks created during the test
    if (createdTaskIds.length > 0) {
      await tasksApi.deleteTasks(createdTaskIds);
      createdTaskIds = [];
    }
  });

  // ═══════════════════════════════════════════════════════════
  // STATS & METRICS DISPLAY
  // ═══════════════════════════════════════════════════════════

  test('Dashboard displays valid non-negative stat numbers on load', async ({ dashboardPage }) => {
    const stats = await dashboardPage.getStatValues();
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.todo).toBeGreaterThanOrEqual(0);
    expect(stats.inProgress).toBeGreaterThanOrEqual(0);
    expect(stats.done).toBeGreaterThanOrEqual(0);
    expect(stats.overdue).toBeGreaterThanOrEqual(0);
  });

  test('Total tasks stat equals sum of status counts (To-Do + In Progress + Done)', async ({ dashboardPage }) => {
    const stats = await dashboardPage.getStatValues();
    expect(stats.total).toBe(stats.todo + stats.inProgress + stats.done);
  });

  // ═══════════════════════════════════════════════════════════
  // UI CREATION & STAT DYNAMICS
  // ═══════════════════════════════════════════════════════════

  test('Creating a task via UI updates Dashboard stats and Recent Tasks list', async ({ dashboardPage, taskModalPage }) => {
    const initialStats = await dashboardPage.getStatValues();
    const taskTitle = `UI Task ${Date.now()}`;

    // Click + New Task button
    await dashboardPage.clickNewTask();
    await taskModalPage.verifyModalVisible('New Task');

    // Fill form and save
    await taskModalPage.createTask({
      title: taskTitle,
      description: 'Created via Playwright UI test',
      status: 'todo',
      priority: 'high',
    });

    // Expect Toast confirmation
    await dashboardPage.expectToastMessage('Task created');

    // Verify stats updated
    const updatedStats = await dashboardPage.getStatValues();
    expect(updatedStats.total).toBe(initialStats.total + 1);
    expect(updatedStats.todo).toBe(initialStats.todo + 1);

    // Verify task appears at top of Recent Tasks list
    await expect(dashboardPage.recentTasksList).toContainText(taskTitle);
  });

  // ═══════════════════════════════════════════════════════════
  // API PRE-CONDITIONS & DYNAMIC UPDATES
  // ═══════════════════════════════════════════════════════════

  test('Updating task status via API updates Dashboard status counts on refresh', async ({ loginPage, dashboardPage, tasksApi }) => {
    // Pre-condition: Create a To-Do task via API
    const task = await tasksApi.createTask({
      title: `API Status Task ${Date.now()}`,
      status: 'todo',
      priority: 'medium',
    });
    createdTaskIds.push(task.id);

    // Re-login to load dashboard with initial created task
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await dashboardPage.verifyDashboardLoaded();
    const beforeStats = await dashboardPage.getStatValues();

    // Change status from To-Do to Done via API
    await tasksApi.updateTask(task.id, { status: 'done' });

    // Re-login to fetch fresh dashboard data
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await dashboardPage.verifyDashboardLoaded();
    const afterStats = await dashboardPage.getStatValues();

    expect(afterStats.todo).toBe(beforeStats.todo - 1);
    expect(afterStats.done).toBe(beforeStats.done + 1);
    expect(afterStats.total).toBe(beforeStats.total);
  });

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION & USER BADGE
  // ═══════════════════════════════════════════════════════════

  test('User badge shows correct name and role for logged-in user', async ({ dashboardPage }) => {
    await dashboardPage.verifyUserBadge(config.users.admin.name, config.users.admin.role);
  });

  test('Clicking a recent task navigates to task detail, and Back returns to Dashboard', async ({ loginPage, dashboardPage, tasksApi, page }) => {
    // Pre-condition: Create a task via API to guarantee at least one item in Recent Tasks
    const task = await tasksApi.createTask({
      title: `Nav Test Task ${Date.now()}`,
      status: 'todo',
    });
    createdTaskIds.push(task.id);

    // Re-login to update dashboard feed
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);

    // Click task in Recent Tasks list
    await dashboardPage.clickRecentTaskByTitle(task.title);

    // Verify navigation to Detail page
    await dashboardPage.verifyPageTitle('Task Detail');

    // Click ← Back button
    await page.getByTestId('back-to-list-btn').click();

    // Verify returned to Dashboard
    await dashboardPage.verifyDashboardLoaded();
  });
});
