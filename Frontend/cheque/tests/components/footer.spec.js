import { test, expect } from '@playwright/test';

test.describe('Footer Component', () => {
  test('should display footer on landing page', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should display copyright text', async ({ page }) => {
    await page.goto('/');
    const currentYear = new Date().getFullYear();
    await expect(page.locator(`text=© ${currentYear} Q-cheque Systems`)).toBeVisible();
  });

  test('should display "All rights reserved" text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=All rights reserved')).toBeVisible();
  });

  test('should display footer on login page', async ({ page }) => {
    await page.goto('/login');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should display footer on register page', async ({ page }) => {
    await page.goto('/register');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have proper footer styling', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toHaveClass(/text-gray-400/);
    await expect(footer).toHaveClass(/text-xs/);
    await expect(footer).toHaveClass(/border-t/);
    await expect(footer).toHaveClass(/bg-white/);
  });

  test('should have centered text in footer', async ({ page }) => {
    await page.goto('/');
    const footerContent = page.locator('footer > div');
    await expect(footerContent).toHaveClass(/text-center/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should display footer on all main pages', async ({ page }) => {
    const pages = ['/', '/login', '/register'];
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    }
  });
});
