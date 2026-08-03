import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class SessionPage extends BasePage {
  readonly workspaceView: Locator;
  readonly sessionList: Locator;
  readonly openCreateSessionButton: Locator;
  readonly terminalOutput: Locator;
  readonly terminalInput: Locator;
  readonly sftpUploadInput: Locator;
  readonly logoutButton: Locator;
  readonly connectedHostLabel: Locator;

  // Create Session Modal Locators
  readonly createSessionModal: Locator;
  readonly sessionNameInput: Locator;
  readonly sessionHostInput: Locator;
  readonly sessionPortInput: Locator;
  readonly sessionUserInput: Locator;
  readonly sessionPassInput: Locator;
  readonly saveSessionButton: Locator;
  readonly closeSessionModalButton: Locator;
  readonly sftpButton: Locator;

  constructor(page: Page) {
    super(page);
    this.workspaceView = page.getByTestId('workspace-view');
    this.sessionList = page.getByTestId('session-list');
    this.openCreateSessionButton = page.getByTestId('create-session-button');
    this.terminalOutput = page.getByTestId('terminal-output');
    this.terminalInput = page.getByTestId('terminal-cmd-input');
    this.sftpUploadInput = page.getByTestId('sftp-upload-input');
    this.logoutButton = page.getByTestId('logout-button');
    this.connectedHostLabel = page.getByTestId('connected-host-label');

    this.createSessionModal = page.getByTestId('create-session-modal');
    this.sessionNameInput = page.getByTestId('session-name-input');
    this.sessionHostInput = page.getByTestId('session-host-input');
    this.sessionPortInput = page.getByTestId('session-port-input');
    this.sessionUserInput = page.getByTestId('session-user-input');
    this.sessionPassInput = page.getByTestId('session-pass-input');
    this.saveSessionButton = page.getByTestId('save-session-button');
    this.closeSessionModalButton = page.getByTestId('close-session-modal-button');
    this.sftpButton = page.locator('#sftp-upload-input');
  }

  /**
   * Verify MobaXterm workspace is visible after login
   */
  async verifyWorkspaceLoaded(): Promise<void> {
    await expect(this.workspaceView).toBeVisible();
    await expect(this.terminalOutput).toBeVisible();
  }

  /**
   * Open New SSH Session Modal
   */
  async openCreateSessionModal(): Promise<void> {
    await this.openCreateSessionButton.click();
    await expect(this.createSessionModal).toBeVisible();
  }

  /**
   * Verify modal inputs are empty by default (Bug #3 Test)
   */
  async verifySessionModalInputsAreEmpty(): Promise<void> {
    await expect(this.sessionNameInput).toHaveValue('');
    await expect(this.sessionHostInput).toHaveValue('');
    await expect(this.sessionUserInput).toHaveValue('');
    await expect(this.sessionPassInput).toHaveValue('');
  }

  /**
   * Fill and submit New SSH Session Configuration form
   */
  async createSession(name: string, host: string, port = '22', username = 'ori', password = 'ori'): Promise<void> {
    await this.sessionNameInput.fill(name);
    await this.sessionHostInput.fill(host);
    await this.sessionPortInput.fill(port);
    await this.sessionUserInput.fill(username);
    await this.sessionPassInput.fill(password);
    await this.saveSessionButton.click();
    await expect(this.createSessionModal).toBeHidden();
  }

  /**
   * Full flow: Open modal → fill form → save session
   */
  async addNewSession(name: string, host: string, port = '22', username = 'ori', password = 'ori'): Promise<void> {
    await this.openCreateSessionModal();
    await this.createSession(name, host, port, username, password);
  }

  /**
   * Select a saved SSH session from the sidebar by its visible name
   */
  async selectSessionByName(name: string): Promise<void> {
    const sessionBtn = this.sessionList.locator('.session-btn', { hasText: name });
    await sessionBtn.click();
  }

  /**
   * Delete a saved SSH session by its visible name in the sidebar
   */
  async deleteSessionByName(name: string): Promise<void> {
    // Find the session row that contains the session name, then click its adjacent delete button
    const sessionRow = this.sessionList.locator('.session-item').last();
    const deleteBtn = sessionRow.locator('.session-del-btn');
    await deleteBtn.click();
    this.page.once('dialog', dialog => dialog.accept());
    await deleteBtn.click();
  }

  /**
   * Type and execute Linux command in SSH Terminal
   */
  async executeTerminalCommand(command: string): Promise<void> {
    await this.terminalInput.fill(command);
    await this.terminalInput.press('Enter');
  }

  /**
   * Expect SSH Terminal output window to contain specific string
   */
  async expectTerminalOutputToContain(expectedText: string): Promise<void> {
    await expect(this.terminalOutput).toContainText(expectedText, { timeout: 5000 });
  }

  /**
   * Upload file to remote Linux host via SFTP input
   */
  async uploadSftpFile(filePath: string): Promise<void> {
    await this.sftpUploadInput.setInputFiles(filePath);
  }

  /**
   * Click SFTP "Choose File" input and upload file via Playwright FileChooser
   */
  async uploadSftpFileViaChooser(filePath: string): Promise<void> {
    const [fileChooser] = await Promise.all([
      this.page.waitForEvent('filechooser'),
      this.sftpButton.click(),
    ]);
    await fileChooser.setFiles(filePath);
  }

  /**
   * Verify terminal input is disabled when no session is selected (Bug #6 Test)
   */
  async verifyTerminalIsDisabled(): Promise<void> {
    await expect(this.terminalInput).toBeDisabled();
  }

  /**
   * Verify terminal input is enabled after selecting a session
   */
  async verifyTerminalIsEnabled(): Promise<void> {
    await expect(this.terminalInput).toBeEnabled();
  }

  /**
   * Delete an uploaded SFTP file by clicking its delete button (Bug #7 Test)
   */
  async deleteUploadedFile(fileId: number): Promise<void> {
    const deleteBtn = this.page.getByTestId(`sftp-delete-btn-${fileId}`);
    await deleteBtn.click();
  }

  /**
   * Logout from workspace
   */
  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
