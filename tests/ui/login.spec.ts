import { test, expect } from '../../src/core/fixtures/custom-fixtures';
import { config } from '../../src/core/config/env.config';

test.describe('Login Tests @auth', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // ═══════════════════════════════════════════════════════════
  // POSITIVE TESTS
  // ═══════════════════════════════════════════════════════════

  test('Successful login with admin credentials', async ({ loginPage, basePage }) => {
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();
    await basePage.verifyUserBadge(config.users.admin.name, config.users.admin.role);
  });

  test('Successful login with manager credentials', async ({ loginPage, basePage }) => {
    await loginPage.login(config.users.manager.email, config.users.manager.password);
    await expect(basePage.appShell).toBeVisible();
    await basePage.verifyUserBadge(config.users.manager.name, config.users.manager.role);
  });

  test('Successful login with member credentials', async ({ loginPage, basePage }) => {
    await loginPage.login(config.users.member.email, config.users.member.password);
    await expect(basePage.appShell).toBeVisible();
    await basePage.verifyUserBadge(config.users.member.name, config.users.member.role);
  });

  test('Login redirects to Dashboard page', async ({ loginPage, basePage }) => {
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await basePage.verifyPageTitle('Dashboard');
  });

  test('Login form fields are empty by default', async ({ loginPage }) => {
    await loginPage.verifyLoginFieldsAreEmpty();
  });

  // ═══════════════════════════════════════════════════════════
  // NEGATIVE TESTS
  // ═══════════════════════════════════════════════════════════

  test('Login fails with wrong password', async ({ loginPage }) => {
    await loginPage.login(config.users.admin.email, 'WrongPassword123!');
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login fails with wrong email', async ({ loginPage }) => {
    await loginPage.login('nonexistent@taskflow.com', 'Admin123!');
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login fails with both wrong email and password', async ({ loginPage }) => {
    await loginPage.login('fake@email.com', 'fakepassword');
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login fails with empty email field', async ({ loginPage }) => {
    await loginPage.login('', config.users.admin.password);
    await expect(loginPage.authView).toBeVisible();
  });

  test('Login fails with empty password field', async ({ loginPage }) => {
    await loginPage.login(config.users.admin.email, '');
    await expect(loginPage.authView).toBeVisible();
  });

  test('Login fails with both fields empty', async ({ loginPage }) => {
    await loginPage.login('', '');
    await expect(loginPage.authView).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════

  test('Login fails with email that has leading/trailing spaces', async ({ loginPage }) => {
    await loginPage.login('  admin@taskflow.com  ', config.users.admin.password);
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login fails with password that has leading/trailing spaces', async ({ loginPage }) => {
    await loginPage.login(config.users.admin.email, '  Admin123!  ');
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login is case-sensitive for email', async ({ loginPage }) => {
    await loginPage.login('ADMIN@TASKFLOW.COM', config.users.admin.password);
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login is case-sensitive for password', async ({ loginPage }) => {
    await loginPage.login(config.users.admin.email, 'admin123!');
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  // ═══════════════════════════════════════════════════════════
  // SPECIAL CHARACTERS
  // ═══════════════════════════════════════════════════════════

  test('Login fails with SQL injection in email', async ({ loginPage }) => {
    await loginPage.login("' OR 1=1 --", config.users.admin.password);
    await expect(loginPage.authView).toBeVisible();
  });

  test('Login fails with XSS script in email', async ({ loginPage }) => {
    await loginPage.login('<script>alert("xss")</script>', 'password');
    await expect(loginPage.authView).toBeVisible();
  });

  test('Login fails with special characters in password', async ({ loginPage }) => {
    await loginPage.login(config.users.admin.email, '!@#$%^&*()_+{}|:<>?');
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login fails with very long email (256+ characters)', async ({ loginPage }) => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    await loginPage.login(longEmail, 'password123');
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  test('Login fails with very long password (256+ characters)', async ({ loginPage }) => {
    const longPassword = 'P'.repeat(300);
    await loginPage.login(config.users.admin.email, longPassword);
    await loginPage.verifyLoginErrorVisible('Invalid email or password');
  });

  // ═══════════════════════════════════════════════════════════
  // UI BEHAVIOR
  // ═══════════════════════════════════════════════════════════

  test('Login page shows link to registration form', async ({ loginPage }) => {
    await expect(loginPage.showRegisterLink).toBeVisible();
  });

  test('Clicking "Register" link shows registration form', async ({ loginPage }) => {
    await loginPage.switchToRegister();
    await expect(loginPage.registerForm).toBeVisible();
    await expect(loginPage.loginForm).toBeHidden();
  });

  test('Logout returns user to login page', async ({ loginPage, basePage }) => {
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();
    await basePage.logout();
    await expect(loginPage.authView).toBeVisible();
  });

  test('Login fields are cleared after logout', async ({ loginPage, basePage }) => {
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();
    await basePage.logout();
    await loginPage.verifyLoginFieldsAreEmpty();
  });

  // ═══════════════════════════════════════════════════════════
  // REMEMBER ME
  // ═══════════════════════════════════════════════════════════

  test('Remember Me checked — user stays logged in after page refresh', async ({ loginPage, basePage }) => {
    await loginPage.rememberMeCheckbox.check();
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();

    // Refresh the page — user should still be logged in
    await loginPage.page.reload();
    await expect(basePage.appShell).toBeVisible();
  });

  test('Remember Me unchecked — user is logged out after page refresh', async ({ loginPage, basePage }) => {
    await loginPage.login(config.users.admin.email, config.users.admin.password);
    await expect(basePage.appShell).toBeVisible();

    // Refresh the page — user should be back at login
    await loginPage.page.reload();
    await expect(loginPage.authView).toBeVisible();
  });

  test('Remember Me checkbox is unchecked by default', async ({ loginPage }) => {
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
  });
});
