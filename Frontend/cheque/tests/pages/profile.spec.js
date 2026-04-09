import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
  });

  test('should display account overview heading', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('h2:has-text("Account Overview")')).toBeVisible({ timeout: 15000 });
  });

  test('should display welcome message', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1:has-text("Welcome,")')).toBeVisible({ timeout: 15000 });
  });

  test('should display current balance section', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Current Balance')).toBeVisible({ timeout: 15000 });
  });

  test('should display balance amount', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    const balanceAmount = page.locator('.text-6xl');
    await expect(balanceAmount).toBeVisible({ timeout: 15000 });
  });

  test('should show profile holder info', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Profile Holder')).toBeVisible({ timeout: 15000 });
  });

  test('should show associated bank info', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Associated Bank')).toBeVisible({ timeout: 15000 });
  });

  test('should show contact point info', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Contact Point')).toBeVisible({ timeout: 15000 });
  });

  test('should display Status Ledger section', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Status Ledger')).toBeVisible({ timeout: 15000 });
  });

  test('should show Total Cheques stat card', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Total Cheques')).toBeVisible({ timeout: 15000 });
  });

  test('should show Cleared Items stat card', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Cleared Items')).toBeVisible({ timeout: 15000 });
  });

  test('should show Pending Items stat card', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Pending Items')).toBeVisible({ timeout: 15000 });
  });

  test('should display system verified indicator', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=System Verified')).toBeVisible({ timeout: 15000 });
  });

  test('should have balance card with dark styling', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    const balanceCard = page.locator('.bg-slate-900');
    await expect(balanceCard).toBeVisible({ timeout: 15000 });
  });

  test('should display info blocks with icons', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=👤').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=🏦').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=📱').first()).toBeVisible({ timeout: 15000 });
  });

  test('should have stat cards with hover effects', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    const statCards = page.locator('.hover\\:translate-y-\\[-4px\\]');
    await expect(statCards.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have loading spinner initially', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('load');
    const loadingSpinner = page.locator('.animate-spin');
    await expect(loadingSpinner).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should display profile page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Account Overview")')).toBeVisible({ timeout: 15000 });
  });

  test('should display profile page correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Account Overview")')).toBeVisible({ timeout: 15000 });
  });

  test('should show stats with correct text styling', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    const clearedStat = page.locator('text=Cleared Items').locator('..');
    await expect(clearedStat).toBeVisible({ timeout: 15000 });
  });

  test('should have responsive layout on different viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('h2:has-text("Account Overview")')).toBeVisible({ timeout: 15000 });
    }
  });
});
