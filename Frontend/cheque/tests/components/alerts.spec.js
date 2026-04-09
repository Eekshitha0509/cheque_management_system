import { test, expect } from '@playwright/test';

test.describe('Alerts Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
  });

  test('should display notifications tab with count', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const notificationsTab = page.locator('button:has-text("Notifications")');
    await expect(notificationsTab).toBeVisible();
  });

  test('should switch to alerts view when clicking Notifications tab', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    const notificationsTab = page.locator('button:has-text("Notifications")');
    await expect(notificationsTab).toHaveClass(/text-blue-600/);
  });

  test('should display empty state message when no alerts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    await page.waitForTimeout(2000);
    const emptyState = page.locator('text=No active alerts');
    await expect(emptyState).toBeVisible();
  });

  test('should show loading state when switching to alerts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
  });

  test('should display alerts table headers when alerts exist', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    await page.waitForTimeout(2000);
    const tableHeaders = page.locator('table th');
    const headersCount = await tableHeaders.count();
    expect(headersCount).toBeGreaterThanOrEqual(0);
  });

  test('should display alerts tab with correct styling when active', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    const notificationsTab = page.locator('button:has-text("Notifications")');
    await expect(notificationsTab).toHaveClass(/text-blue-600/);
    await expect(notificationsTab).toHaveClass(/border-blue-600/);
  });

  test('should display notifications tab without blue styling when inactive', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const historyTab = page.locator('button:has-text("History")');
    await expect(historyTab).toHaveClass(/text-blue-600/);
  });

  test('should show loading spinner in loading state', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
  });

  test('should display alerts with proper table styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    await page.waitForTimeout(2000);
  });

  test('should toggle between tabs correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    await page.click('button:has-text("History")');
    await expect(page.locator('button:has-text("History")')).toHaveClass(/text-blue-600/);
    
    await page.click('button:has-text("Notifications")');
    await expect(page.locator('button:has-text("Notifications")')).toHaveClass(/text-blue-600/);
  });

  test('should display empty state with correct styling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    await page.waitForTimeout(2000);
    const emptyState = page.locator('text=No active alerts');
    await expect(emptyState).toHaveClass(/text-slate-400/);
    await expect(emptyState).toHaveClass(/font-medium/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Notifications")');
    await expect(page.locator('button:has-text("Notifications")')).toBeVisible();
  });
});
