import { Page, Locator, expect } from '@playwright/test';

/**
 * LoginPage — handles Login & Registration forms
 * This is the only page that does NOT extend BasePage,
 * because the NavBar doesn't exist before authentication.
 */
export class LoginPage {
  readonly page: Page;

  // Auth View
  readonly authView: Locator;

  // Login Form
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly loginErrorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  // Register Form
  readonly registerForm: Locator;
  readonly registerNameInput: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly registerErrorMessage: Locator;

  // Toggle Links
  readonly showRegisterLink: Locator;
  readonly showLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Auth View
    this.authView = page.getByTestId('auth-view');

    // Login Form
    this.loginForm = page.getByTestId('login-form');
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.getByTestId('login-submit-btn');
    this.loginErrorMessage = page.getByTestId('login-error-message');
    this.rememberMeCheckbox = page.getByTestId('remember-me-checkbox');

    // Register Form
    this.registerForm = page.getByTestId('register-form');
    this.registerNameInput = page.getByTestId('register-name-input');
    this.registerEmailInput = page.getByTestId('register-email-input');
    this.registerPasswordInput = page.getByTestId('register-password-input');
    this.registerButton = page.getByTestId('register-submit-btn');
    this.registerErrorMessage = page.getByTestId('register-error-message');

    // Toggle Links
    this.showRegisterLink = page.getByTestId('show-register-link');
    this.showLoginLink = page.getByTestId('show-login-link');
  }

  // ─── Navigation ─────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/');
    if (await this.page.getByTestId('app-shell').isVisible()) {
      await this.page.getByTestId('logout-btn').click();
    }
    await expect(this.authView).toBeVisible();
  }

  // ─── Login ──────────────────────────────────────────────

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // ─── Register ───────────────────────────────────────────

  async switchToRegister(): Promise<void> {
    await this.showRegisterLink.click();
    await expect(this.registerForm).toBeVisible();
  }

  async switchToLogin(): Promise<void> {
    await this.showLoginLink.click();
    await expect(this.loginForm).toBeVisible();
  }

  async register(name: string, email: string, password: string): Promise<void> {
    await this.switchToRegister();
    await this.registerNameInput.fill(name);
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerButton.click();
  }

  // ─── Assertions ─────────────────────────────────────────

  async verifyLoginFieldsAreEmpty(): Promise<void> {
    await expect(this.emailInput).toHaveValue('');
    await expect(this.passwordInput).toHaveValue('');
  }

  async verifyRegisterFieldsAreEmpty(): Promise<void> {
    await this.switchToRegister();
    await expect(this.registerNameInput).toHaveValue('');
    await expect(this.registerEmailInput).toHaveValue('');
    await expect(this.registerPasswordInput).toHaveValue('');
  }

  async verifyLoginErrorVisible(expectedText: string): Promise<void> {
    await expect(this.loginErrorMessage).toBeVisible();
    await expect(this.loginErrorMessage).toContainText(expectedText);
  }

  async verifyRegisterErrorVisible(expectedText: string): Promise<void> {
    await expect(this.registerErrorMessage).toBeVisible();
    await expect(this.registerErrorMessage).toContainText(expectedText);
  }
}
