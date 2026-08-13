import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Role-Based Access Control (RBAC) UI Suite @users', () => {
  let adminTaskId: number;
  let adminTaskTitle: string;

  test.beforeEach(async ({ tasksApi }) => {
    // Setup pre-condition via API: Create an Admin-owned task to test permissions against in UI
    await tasksApi.login();
    adminTaskTitle = `Admin_Task_${Date.now()}`;
    const task = await tasksApi.createTask({
      title: adminTaskTitle,
      status: 'todo',
      priority: 'high',
    });
    adminTaskId = task.id;
  });

  test.afterEach(async ({ tasksApi }) => {
    // Teardown admin task via API helper
    if (adminTaskId) {
      try {
        await tasksApi.deleteTask(adminTaskId);
      } catch (e) {
        // Ignore if already deleted
      }
    }
  });

  test.afterAll(async ({ tasksApi }) => {
    // Teardown all test users created during tests, preserving Admin User and Ori
    try {
      await tasksApi.cleanupTestUsers();
    } catch (e) {
      console.warn('Could not cleanup test users afterAll:', e);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // MEMBER ROLE PERMISSIONS & UI RESTRICTIONS
  // ═══════════════════════════════════════════════════════════

  test('Member user cannot delete another user task in UI', async ({ loginPage, taskListPage, basePage }) => {
    const memberEmail = `member_del_ui_${Date.now()}@taskflow.com`;
    const memberPassword = 'MemberPass1!';

    // Register & Login as Member
    await loginPage.goto();
    await loginPage.register('Member DelUI', memberEmail, memberPassword);
    await expect(basePage.appShell).toBeVisible();

    // Navigate to Task List page
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Click Delete button on Admin task row
    await taskListPage.deleteTaskById(adminTaskId);

    // App logs user out and redirects to auth-view on 403 Forbidden
    await expect(loginPage.authView).toBeVisible();
  });

  test('Member user cannot edit another user task in UI', async ({ loginPage, taskListPage, taskModalPage, basePage }) => {
    const memberEmail = `member_edit_ui_${Date.now()}@taskflow.com`;
    const memberPassword = 'MemberPass1!';

    await loginPage.goto();
    await loginPage.register('Member EditUI', memberEmail, memberPassword);
    await expect(basePage.appShell).toBeVisible();

    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    // Attempt to edit Admin's task via UI modal
    await taskListPage.editTaskById(adminTaskId);
    await taskModalPage.verifyModalVisible('Edit Task');
    await taskModalPage.fillTaskForm({ title: 'Unauthorized Edit Title' });
    await taskModalPage.submitTaskForm();

    // App logs user out and redirects to auth-view on 403 Forbidden
    await expect(loginPage.authView).toBeVisible();
  });

  test('Member user cannot access Users page link in UI sidebar navigation', async ({ loginPage, basePage }) => {
    const memberEmail = `member_nav_${Date.now()}@taskflow.com`;
    const memberPassword = 'MemberPass1!';

    await loginPage.goto();
    await loginPage.register('Member NavTest', memberEmail, memberPassword);
    await expect(basePage.appShell).toBeVisible();

    // Verify Users navigation item is visible in DOM for member
    await basePage.verifyUsersNavVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // MANAGER ROLE PERMISSIONS & UI ACTIONS
  // ═══════════════════════════════════════════════════════════

  test('Manager user can edit any task in UI regardless of creator', async ({ tasksApi, request, loginPage, taskListPage, taskModalPage, basePage }) => {
    // 1. Setup Manager user via API pre-condition
    await tasksApi.login();
    const managerEmail = `manager_edit_ui_${Date.now()}@taskflow.com`;
    const managerPassword = 'ManagerPass1!';

    const regRes = await request.post(`${config.baseUrl}/api/v1/auth/register`, {
      data: { name: 'Manager EditUI', email: managerEmail, password: managerPassword }
    });
    const managerUser = (await regRes.json()).user;

    await request.put(`${config.baseUrl}/api/v1/users/${managerUser.id}`, {
      headers: { 'Authorization': `Bearer ${tasksApi.authToken}` },
      data: { role: 'manager' }
    });

    // 2. Login as Manager in UI
    await loginPage.goto();
    await loginPage.login(managerEmail, managerPassword);
    await expect(basePage.appShell).toBeVisible();

    // 3. Edit Admin's task in UI
    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    await taskListPage.editTaskById(adminTaskId);
    await taskModalPage.verifyModalVisible('Edit Task');
    await taskModalPage.fillTaskForm({ status: 'done' });
    await taskModalPage.submitTaskForm();

    await taskListPage.expectToastMessage('Task updated');
  });

  test('Manager user can delete any task in UI regardless of creator', async ({ tasksApi, request, loginPage, taskListPage, basePage }) => {
    await tasksApi.login();
    const managerEmail = `manager_del_ui_${Date.now()}@taskflow.com`;
    const managerPassword = 'ManagerPass1!';

    const regRes = await request.post(`${config.baseUrl}/api/v1/auth/register`, {
      data: { name: 'Manager DelUI', email: managerEmail, password: managerPassword }
    });
    const managerUser = (await regRes.json()).user;

    await request.put(`${config.baseUrl}/api/v1/users/${managerUser.id}`, {
      headers: { 'Authorization': `Bearer ${tasksApi.authToken}` },
      data: { role: 'manager' }
    });

    await loginPage.goto();
    await loginPage.login(managerEmail, managerPassword);
    await expect(basePage.appShell).toBeVisible();

    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    await taskListPage.deleteTaskById(adminTaskId);
    await taskListPage.expectToastMessage('Task deleted');
  });

  test('Manager user cannot change a user role in UI', async ({ tasksApi, request, loginPage, usersPage, basePage }) => {
    await tasksApi.login();
    const managerEmail = `mgr_role_ui_${Date.now()}@taskflow.com`;
    const managerPassword = 'ManagerPass1!';

    const regRes = await request.post(`${config.baseUrl}/api/v1/auth/register`, {
      data: { name: 'Manager RoleUI', email: managerEmail, password: managerPassword }
    });
    const managerUser = (await regRes.json()).user;

    await request.put(`${config.baseUrl}/api/v1/users/${managerUser.id}`, {
      headers: { 'Authorization': `Bearer ${tasksApi.authToken}` },
      data: { role: 'manager' }
    });

    await loginPage.goto();
    await loginPage.login(managerEmail, managerPassword);
    await expect(basePage.appShell).toBeVisible();

    // Navigate to Users page and attempt role change
    await usersPage.navigateTo('users');
    await usersPage.verifyUsersPageLoaded();
    await usersPage.changeUserRoleByName('Ori', 'admin');

    // App logs out / rejects unauthorized user role update attempt
    await expect(loginPage.authView).toBeVisible();
  });

  test('Manager user cannot delete a user from Users management in UI', async ({ tasksApi, request, loginPage, usersPage, basePage }) => {
    await tasksApi.login();
    const managerEmail = `mgr_delusr_ui_${Date.now()}@taskflow.com`;
    const managerPassword = 'ManagerPass1!';

    const regRes = await request.post(`${config.baseUrl}/api/v1/auth/register`, {
      data: { name: 'Manager DelUserUI', email: managerEmail, password: managerPassword }
    });
    const managerUser = (await regRes.json()).user;

    await request.put(`${config.baseUrl}/api/v1/users/${managerUser.id}`, {
      headers: { 'Authorization': `Bearer ${tasksApi.authToken}` },
      data: { role: 'manager' }
    });

    await loginPage.goto();
    await loginPage.login(managerEmail, managerPassword);
    await expect(basePage.appShell).toBeVisible();

    await usersPage.navigateTo('users');
    await usersPage.verifyUsersPageLoaded();

    // Attempt to delete user ID 6 (Ori)
    await usersPage.deleteUserById(6);

    // App logs out / rejects unauthorized delete user attempt
    await expect(loginPage.authView).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // ADMIN ROLE PERMISSIONS & UI FULL CONTROL
  // ═══════════════════════════════════════════════════════════

  test('Admin user can view and edit any task in UI', async ({ loginPage, taskListPage, taskModalPage, basePage }) => {
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();

    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    await taskListPage.editTaskById(adminTaskId);
    await taskModalPage.verifyModalVisible('Edit Task');
    await taskModalPage.fillTaskForm({ status: 'done' });
    await taskModalPage.submitTaskForm();

    await taskListPage.expectToastMessage('Task updated');
  });

  test('Admin user can change any user role in Users management UI', async ({ loginPage, usersPage, basePage }) => {
    const targetUserName = `UserToPromote_${Date.now()}`;
    const memberEmail = `to_promote_${Date.now()}@taskflow.com`;
    const memberPassword = 'PromotePass1!';

    // Register target user using Page Object method
    await loginPage.goto();
    await loginPage.register(targetUserName, memberEmail, memberPassword);
    await expect(basePage.appShell).toBeVisible();

    // Switch to Admin: logout first to return to login form
    await basePage.logout();
    await loginPage.switchToLogin();
    await loginPage.login(config.users.admin.email, config.users.admin.password);

    // Promote in Users page UI via UsersPage helper
    await usersPage.navigateTo('users');
    await usersPage.verifyUsersPageLoaded();
    await usersPage.changeUserRoleByName(targetUserName, 'manager');
    await usersPage.expectToastMessage('User role updated');
  });

  test('Admin user can delete any task from the task board in UI', async ({ loginPage, taskListPage, basePage }) => {
    await loginPage.goto();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();

    await taskListPage.navigateTo('list');
    await taskListPage.verifyListPageLoaded();

    await taskListPage.deleteTaskById(adminTaskId);
    await taskListPage.expectToastMessage('Task deleted');
  });
});
