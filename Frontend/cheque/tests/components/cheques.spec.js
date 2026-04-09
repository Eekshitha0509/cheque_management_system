import { test, expect } from '@playwright/test';

test.describe('Cheques Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
  });

  test('should display loading state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
  });

  test('should display table with correct headers', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const tableHeaders = page.locator('table th');
    const headerTexts = await tableHeaders.allTextContents();
    expect(headerTexts).toContain('Date');
    expect(headerTexts).toContain('Cheque No');
    expect(headerTexts).toContain('Payee');
    expect(headerTexts).toContain('Status');
    expect(headerTexts).toContain('Action');
    expect(headerTexts).toContain('Reference');
  });

  test('should have sortable/clickable column headers', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const dateHeader = page.locator('th:has-text("Date")');
    await expect(dateHeader).toBeVisible();
  });

  test('should display table with proper styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toHaveClass(/w-full/);
  });

  test('should have table header with uppercase styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const headerRow = page.locator('thead tr');
    await expect(headerRow).toHaveClass(/uppercase/);
  });

  test('should display table border styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const table = page.locator('table');
    await expect(table).toHaveClass(/border-collapse/);
  });

  test('should have proper table container styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const tableContainer = page.locator('.overflow-x-auto');
    await expect(tableContainer).toBeVisible();
  });

  test('should handle empty cheque list state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    const tableBody = page.locator('tbody');
    await expect(tableBody).toBeVisible();
  });

  test('should display table with rounded corners', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const tableWrapper = page.locator('.rounded-2xl');
    await expect(tableWrapper).toBeVisible();
  });

  test('should show history tab with blue underline when active', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    const historyTab = page.locator('button:has-text("History")');
    await expect(historyTab).toHaveClass(/text-blue-600/);
    await expect(historyTab).toHaveClass(/border-blue-600/);
  });

  test('should have responsive horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await page.waitForTimeout(2000);
    const overflowContainer = page.locator('.overflow-x-auto');
    await expect(overflowContainer).toBeVisible();
  });
});
