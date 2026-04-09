import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main heading with correct text', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Digital Cheque Management');
    await expect(page.locator('h1 span')).toContainText('Simplified.');
  });

  test('should display hero description text', async ({ page }) => {
    await expect(page.locator('p.text-gray-600')).toContainText('Replace your manual record books');
  });

  test('should have Get Started button linking to register', async ({ page }) => {
    const getStartedButton = page.locator('a:has-text("Get Started Now")');
    await expect(getStartedButton).toBeVisible();
    await expect(getStartedButton).toHaveAttribute('href', '/register');
  });

  test('should navigate to register page when clicking Get Started', async ({ page }) => {
    await page.click('a:has-text("Get Started Now")');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should have proper page layout with centered content', async ({ page }) => {
    const container = page.locator('.min-h-\\[70vh\\]');
    await expect(container).toBeVisible();
  });

  test('should display correct styling for main heading', async ({ page }) => {
    const heading = page.locator('h1');
    await expect(heading).toHaveClass(/text-5xl/);
    await expect(heading.locator('span')).toHaveClass(/text-blue-600/);
  });

  test('should have CTA button with correct styling', async ({ page }) => {
    const button = page.locator('a:has-text("Get Started Now")');
    await expect(button).toHaveClass(/bg-blue-600/);
    await expect(button).toHaveClass(/hover:bg-blue-700/);
    await expect(button).toHaveClass(/text-white/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a:has-text("Get Started Now")')).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a:has-text("Get Started Now")')).toBeVisible();
  });
});
