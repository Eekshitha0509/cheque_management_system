import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
  });

  test('should display dashboard page heading', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1:has-text("My Ledger")')).toBeVisible({ timeout: 15000 });
  });

  test('should display dashboard description', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Manage digital cheques')).toBeVisible({ timeout: 15000 });
  });

  test('should show New Entry button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const newEntryButton = page.locator('button:has-text("New Entry")');
    await expect(newEntryButton).toBeVisible({ timeout: 15000 });
  });

  test('should show History tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const historyTab = page.locator('button:has-text("History")');
    await expect(historyTab).toBeVisible({ timeout: 15000 });
  });

  test('should show Notifications tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const notificationsTab = page.locator('button:has-text("Notifications")');
    await expect(notificationsTab).toBeVisible({ timeout: 15000 });
  });

  test('should switch to New Entry view when clicking New Entry button', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("New Entry")');
    await expect(page.locator('h2:has-text("Digitalize Cheque")')).toBeVisible({ timeout: 15000 });
  });

  test('should show purpose dropdown in upload options', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("New Entry")');
    const purposeDropdown = page.locator('select');
    await expect(purposeDropdown).toBeVisible({ timeout: 15000 });
  });

  test('should show Capture Image button in upload view', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("New Entry")');
    await expect(page.locator('button:has-text("Capture Image")')).toBeVisible({ timeout: 15000 });
  });

  test('should switch to History tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("History")');
    await expect(page.locator('button:has-text("History")')).toHaveClass(/text-blue-600/);
  });

  test('should switch to Notifications tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    await expect(page.locator('button:has-text("Notifications")')).toHaveClass(/text-blue-600/);
  });

  test('should select purpose from dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("New Entry")');
    await page.selectOption('select', 'Salary Payment');
    await expect(page.locator('select')).toHaveValue('Salary Payment');
  });

  test('should have dashboard header styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const header = page.locator('text=My Ledger');
    await expect(header).toBeVisible({ timeout: 15000 });
    await expect(header).toHaveClass(/text-4xl/);
  });

  test('should have sticky header on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const stickyHeader = page.locator('.sticky');
    await expect(stickyHeader).toBeVisible({ timeout: 15000 });
  });

  test('should show upload options card with correct styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("New Entry")');
    const uploadCard = page.locator('.bg-slate-50');
    await expect(uploadCard).toBeVisible({ timeout: 15000 });
  });

  test('should display page correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const newEntryButton = page.locator('button:has-text("+")');
    await expect(newEntryButton).toBeVisible({ timeout: 15000 });
  });

  test('should hide submit button until file is selected', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("New Entry")');
    const submitButton = page.locator('button:has-text("Submit Cheque")');
    await expect(submitButton).not.toBeVisible();
  });

  test('should navigate back to login when not authenticated', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});
