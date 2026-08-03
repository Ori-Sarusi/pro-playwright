import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * LoginPage — handles Login & Registration forms
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  readonly showRegisterLink: Locator;
  readonly showLoginLink: Locator;
  readonly registerForm: Locator;
  readonly registerNameInput: Locator;
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerSubmitButton: Locator;
  readonly registerErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // Login form
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-btn');
    this.errorMessage = page.getByTestId('login-error-message');
    this.rememberMeCheckbox = page.getByTestId('remember-me-checkbox');

    // Navigation links
    this.showRegisterLink = page.getByTestId('show-register-link');
    this.showLoginLink = page.getByTestId('show-login-link');

    // Register form
    this.registerForm = page.getByTestId('register-form');
    this.registerNameInput = page.getByTestId('register-name-input');
    this.registerEmailInput = page.getByTestId('register-email-input');
    this.registerPasswordInput = page.getByTestId('register-password-input');
    this.registerSubmitButton = page.getByTestId('register-submit-btn');
    this.registerErrorMessage = page.getByTestId('register-error-message');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByTestId('auth-view')).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async register(name: string, email: string, password: string): Promise<void> {
    await this.showRegisterLink.click();
    await expect(this.registerForm).toBeVisible();
    await this.registerNameInput.fill(name);
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerSubmitButton.click();
  }

  async verifyLoginFieldsAreEmpty(): Promise<void> {
    await expect(this.emailInput).toHaveValue('');
    await expect(this.passwordInput).toHaveValue('');
  }

  async verifyRegisterFieldsAreEmpty(): Promise<void> {
    await this.showRegisterLink.click();
    await expect(this.registerNameInput).toHaveValue('');
    await expect(this.registerEmailInput).toHaveValue('');
    await expect(this.registerPasswordInput).toHaveValue('');
  }

  async verifyErrorMessageVisible(expectedText: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedText);
  }
}
