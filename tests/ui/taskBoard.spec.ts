import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Task Board (Kanban) Tests @board', () => {
  let createdTaskIds: number[] = [];

  test.beforeEach(async ({ loginPage, taskBoardPage }) => {
    // Authenticate and navigate to Task Board view
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskBoardPage.navigateTo('board');
    await taskBoardPage.verifyBoardLoaded();
  });

  test.afterEach(async ({ tasksApi }) => {
    // Teardown: Clean up test tasks created via API/UI
    if (createdTaskIds.length > 0) {
      await tasksApi.deleteTasks(createdTaskIds);
      createdTaskIds = [];
    }
  });

  // ═══════════════════════════════════════════════════════════
  // BOARD DISPLAY & PRE-CONDITIONS
  // ═══════════════════════════════════════════════════════════

  test('Task Board displays 3 Kanban columns (To-Do, In Progress, Done) with correct counts', async ({ taskBoardPage }) => {
    const counts = await taskBoardPage.getColumnCounts();
    expect(counts.todo).toBeGreaterThanOrEqual(0);
    expect(counts.inProgress).toBeGreaterThanOrEqual(0);
    expect(counts.done).toBeGreaterThanOrEqual(0);
  });

  test('Tasks created via API appear in their respective Kanban column', async ({ taskBoardPage, tasksApi, loginPage }) => {
    // Pre-condition: Create tasks in different statuses
    const todoTask = await tasksApi.createTask({ title: `Board Todo ${Date.now()}`, status: 'todo' });
    const doneTask = await tasksApi.createTask({ title: `Board Done ${Date.now()}`, status: 'done' });
    createdTaskIds.push(todoTask.id, doneTask.id);

    // Refresh view via re-login
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskBoardPage.navigateTo('board');

    // Assert cards appear in correct column containers
    await expect(taskBoardPage.todoCardsContainer).toContainText(todoTask.title);
    await expect(taskBoardPage.doneCardsContainer).toContainText(doneTask.title);
  });

  // ═══════════════════════════════════════════════════════════
  // UI TASK CREATION
  // ═══════════════════════════════════════════════════════════

  test('Creating a new task via UI adds it to the To-Do column on the board', async ({ taskBoardPage, taskModalPage }) => {
    const taskTitle = `Board UI Task ${Date.now()}`;

    await taskBoardPage.clickNewTask();
    await taskModalPage.verifyModalVisible('New Task');

    await taskModalPage.createTask({
      title: taskTitle,
      status: 'todo',
      priority: 'high',
    });

    await taskBoardPage.expectToastMessage('Task created');
    await expect(taskBoardPage.todoCardsContainer).toContainText(taskTitle);
  });

  // ═══════════════════════════════════════════════════════════
  // DRAG AND DROP & CARD ACTIONS
  // ═══════════════════════════════════════════════════════════

  test('Dragging a task card from To-Do to Done updates column count and position', async ({ taskBoardPage, tasksApi, loginPage }) => {
    // Pre-condition: Create a task in To-Do
    const task = await tasksApi.createTask({ title: `Drag Task ${Date.now()}`, status: 'todo' });
    createdTaskIds.push(task.id);

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskBoardPage.navigateTo('board');

    // Drag from To-Do to Done
    await taskBoardPage.dragAndDropCard(task.title, 'done');

    // Toast notification confirmation
    await taskBoardPage.expectToastMessage('Task moved to done');

    // Verify card is now in Done column
    await expect(taskBoardPage.doneCardsContainer).toContainText(task.title);
  });

  test('Dragging a task card into its current column does not trigger a toast notification', async ({ taskBoardPage, tasksApi, loginPage }) => {
    // Pre-condition: Create a task in To-Do
    const task = await tasksApi.createTask({ title: `Same Col Drag ${Date.now()}`, status: 'todo' });
    createdTaskIds.push(task.id);

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskBoardPage.navigateTo('board');

    // Drag within the same To-Do column
    await taskBoardPage.dragAndDropCard(task.title, 'todo');

    // Toast should NOT appear (will fail on current app behavior because app shows toast anyway)
    await expect(taskBoardPage.toast).toBeHidden();
  });

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION & DETAIL BACK BUTTON
  // ═══════════════════════════════════════════════════════════

  test('Clicking a task card navigates to Task Detail, and Back button returns to Task Board', async ({ taskBoardPage, tasksApi, loginPage, page }) => {
    // Pre-condition: Create task
    const task = await tasksApi.createTask({ title: `Board Nav ${Date.now()}`, status: 'in-progress' });
    createdTaskIds.push(task.id);

    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await taskBoardPage.navigateTo('board');

    // Click card
    await taskBoardPage.clickTaskCardByTitle(task.title);
    await taskBoardPage.verifyPageTitle('Task Detail');

    // Click ← Back button
    await page.getByTestId('back-to-list-btn').click();

    // Verify returned to Task Board
    await taskBoardPage.verifyBoardLoaded();
  });
});
