import { test } from '@playwright/test';

export class Logger {
  static info(message: string, ...args: any[]) {
    const formatted = `[INFO] [${new Date().toISOString()}] ${message} ${args.length ? JSON.stringify(args) : ''}`;
    console.log(`\x1b[36m${formatted}\x1b[0m`);
    
    try {
      test.info().attach('log:info', {
        body: formatted,
        contentType: 'text/plain'
      });
    } catch {
      // Outside test context
    }
  }

  static step(stepName: string, action: () => Promise<any>) {
    return test.step(stepName, async () => {
      console.log(`\x1b[33m[STEP] ${stepName}\x1b[0m`);
      return await action();
    });
  }

  static error(message: string, error?: any) {
    const formatted = `[ERROR] [${new Date().toISOString()}] ${message} ${error ? error.stack || error : ''}`;
    console.error(`\x1b[31m${formatted}\x1b[0m`);
    
    try {
      test.info().attach('log:error', {
        body: formatted,
        contentType: 'text/plain'
      });
    } catch {
      // Outside test context
    }
  }
}
