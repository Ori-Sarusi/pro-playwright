import { test, expect } from '../../src/core/fixtures/custom-fixtures';

test.describe('Registration Tests @auth', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.switchToRegister();
  });

  // ═══════════════════════════════════════════════════════════
  // POSITIVE TESTS
  // ═══════════════════════════════════════════════════════════

  test('Successful registration with valid credentials', async ({ loginPage, basePage }) => {
    const uniqueEmail = `testuser_${Date.now()}@taskflow.com`;
    await loginPage.registerNameInput.fill('Test User');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('TestPass123!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  test('Registration auto-logs in the user after success', async ({ loginPage, basePage }) => {
    const uniqueEmail = `autouser_${Date.now()}@taskflow.com`;
    await loginPage.registerNameInput.fill('Auto Login User');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('AutoPass123!');
    await loginPage.registerButton.click();
    await basePage.verifyUserBadge('Auto Login User', 'member');
    await basePage.verifyPageTitle('Dashboard');
  });

  test('New registered user gets "member" role by default', async ({ loginPage, basePage }) => {
    const uniqueEmail = `member_${Date.now()}@taskflow.com`;
    await loginPage.registerNameInput.fill('Member User');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('MemberPass1!');
    await loginPage.registerButton.click();
    await expect(basePage.userRoleLabel).toHaveText('member');
  });

  test('Register form fields are empty by default', async ({ loginPage }) => {
    await expect(loginPage.registerNameInput).toHaveValue('');
    await expect(loginPage.registerEmailInput).toHaveValue('');
    await expect(loginPage.registerPasswordInput).toHaveValue('');
  });

  // ═══════════════════════════════════════════════════════════
  // NEGATIVE TESTS
  // ═══════════════════════════════════════════════════════════

  test('Registration fails with already registered email', async ({ loginPage }) => {
    await loginPage.registerNameInput.fill('Duplicate User');
    await loginPage.registerEmailInput.fill('admin@taskflow.com');
    await loginPage.registerPasswordInput.fill('DuplicatePass1!');
    await loginPage.registerButton.click();
    await loginPage.verifyRegisterErrorVisible('Email already registered');
  });

  test('Registration fails with empty name field', async ({ loginPage }) => {
    await loginPage.registerNameInput.fill('');
    await loginPage.registerEmailInput.fill(`empty_${Date.now()}@test.com`);
    await loginPage.registerPasswordInput.fill('ValidPass123!');
    await loginPage.registerButton.click();
    await expect(loginPage.registerForm).toBeVisible();
  });

  test('Registration fails with empty email field', async ({ loginPage }) => {
    await loginPage.registerNameInput.fill('No Email User');
    await loginPage.registerEmailInput.fill('');
    await loginPage.registerPasswordInput.fill('ValidPass123!');
    await loginPage.registerButton.click();
    await expect(loginPage.registerForm).toBeVisible();
  });

  test('Registration fails with empty password field', async ({ loginPage }) => {
    await loginPage.registerNameInput.fill('No Pass User');
    await loginPage.registerEmailInput.fill(`nopass_${Date.now()}@test.com`);
    await loginPage.registerPasswordInput.fill('');
    await loginPage.registerButton.click();
    await expect(loginPage.registerForm).toBeVisible();
  });

  test('Registration fails with all fields empty', async ({ loginPage }) => {
    await loginPage.registerButton.click();
    await expect(loginPage.registerForm).toBeVisible();
  });

  test('Registration fails with password shorter than 6 characters', async ({ loginPage }) => {
    await loginPage.registerNameInput.fill('Short Pass');
    await loginPage.registerEmailInput.fill(`short_${Date.now()}@test.com`);
    await loginPage.registerPasswordInput.fill('Ab1!');
    await loginPage.registerButton.click();
    await loginPage.verifyRegisterErrorVisible('Password must be at least 6 characters');
  });

  // ═══════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════

  test('Registration with exactly 6-character password succeeds', async ({ loginPage, basePage }) => {
    const uniqueEmail = `sixchar_${Date.now()}@test.com`;
    await loginPage.registerNameInput.fill('Six Char');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('Abc12!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  test('Registration with 5-character password fails', async ({ loginPage }) => {
    await loginPage.registerNameInput.fill('Five Char');
    await loginPage.registerEmailInput.fill(`fivechar_${Date.now()}@test.com`);
    await loginPage.registerPasswordInput.fill('Ab1!x');
    await loginPage.registerButton.click();
    await loginPage.verifyRegisterErrorVisible('Password must be at least 6 characters');
  });

  test('Registration with name containing numbers', async ({ loginPage, basePage }) => {
    const uniqueEmail = `numname_${Date.now()}@test.com`;
    await loginPage.registerNameInput.fill('User123');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('ValidPass1!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  test('Registration with very long name (200 characters)', async ({ loginPage, basePage }) => {
    const longName = 'A'.repeat(200);
    const uniqueEmail = `longname_${Date.now()}@test.com`;
    await loginPage.registerNameInput.fill(longName);
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('LongNamePass1!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // SPECIAL CHARACTERS
  // ═══════════════════════════════════════════════════════════

  test('Registration with special characters in name', async ({ loginPage, basePage }) => {
    const uniqueEmail = `special_${Date.now()}@test.com`;
    await loginPage.registerNameInput.fill("O'Brien-Smith Jr.");
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('SpecialPass1!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  test('Registration with SQL injection in name field', async ({ loginPage, basePage }) => {
    const uniqueEmail = `sqli_${Date.now()}@test.com`;
    await loginPage.registerNameInput.fill("'; DROP TABLE users; --");
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('SQLiPass123!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  test('Registration with XSS script in name field', async ({ loginPage, basePage }) => {
    const uniqueEmail = `xss_${Date.now()}@test.com`;
    await loginPage.registerNameInput.fill('<script>alert("xss")</script>');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('XSSPass123!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  test('Registration with unicode characters in name', async ({ loginPage, basePage }) => {
    const uniqueEmail = `unicode_${Date.now()}@test.com`;
    await loginPage.registerNameInput.fill('Ñoño Müller 日本語');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('UnicodePass1!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();
  });

  // ═══════════════════════════════════════════════════════════
  // UI BEHAVIOR
  // ═══════════════════════════════════════════════════════════

  test('Clicking "Sign In" link returns to login form', async ({ loginPage }) => {
    await loginPage.switchToLogin();
    await expect(loginPage.loginForm).toBeVisible();
    await expect(loginPage.registerForm).toBeHidden();
  });

  test('Switching to login form and back preserves empty fields', async ({ loginPage }) => {
    await loginPage.switchToLogin();
    await loginPage.switchToRegister();
    await expect(loginPage.registerNameInput).toHaveValue('');
    await expect(loginPage.registerEmailInput).toHaveValue('');
    await expect(loginPage.registerPasswordInput).toHaveValue('');
  });

  test('Logging out after registration returns to login form with empty fields', async ({ loginPage, basePage }) => {
    const uniqueEmail = `logout_reg_${Date.now()}@taskflow.com`;

    // Register
    await loginPage.registerNameInput.fill('Logout Reg User');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill('LogoutRegPass1!');
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();

    // Logout
    await basePage.logout();

    // Expect login form to be visible and fields empty (will fail on current app behavior)
    await expect(loginPage.loginForm).toBeVisible();
    await loginPage.verifyLoginFieldsAreEmpty();
  });

  test('Registered user can login with new credentials', async ({ loginPage, basePage }) => {
    const uniqueEmail = `relogin_${Date.now()}@taskflow.com`;
    const password = 'ReloginPass1!';

    // Register
    await loginPage.registerNameInput.fill('Relogin User');
    await loginPage.registerEmailInput.fill(uniqueEmail);
    await loginPage.registerPasswordInput.fill(password);
    await loginPage.registerButton.click();
    await expect(basePage.appShell).toBeVisible();

    // Logout
    await basePage.logout();
    await expect(loginPage.authView).toBeVisible();

    // If registration view is still showing due to the bug, switch back to login view first
    if (await loginPage.registerForm.isVisible()) {
      await loginPage.switchToLogin();
    }

    // Login with same credentials
    await loginPage.login(uniqueEmail, password);
    await expect(basePage.appShell).toBeVisible();
    await basePage.verifyUserBadge('Relogin User', 'member');
  });
});
