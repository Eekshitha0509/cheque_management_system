import { test, expect } from '@playwright/test';

test.describe('Header Component', () => {
  test('should display logo and brand name on landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('img[alt="Q-cheque"]').first()).toBeVisible();
    await expect(page.locator('text=Q-cheque').first()).toBeVisible();
  });

  test('should display login button on landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a:has-text("Login")').first()).toBeVisible();
  });

  test('should navigate to login when clicking login button on landing', async ({ page }) => {
    await page.goto('/');
    await page.click('a:has-text("Login")');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should display profile link on dashboard header', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('a:has-text("Profile")')).toBeVisible({ timeout: 15000 });
  });

  test('should display logout button on dashboard header', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button:has-text("Logout")')).toBeVisible({ timeout: 15000 });
  });

  test('should display Q-cheque Dashboard text on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Q-cheque Dashboard')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to profile from dashboard header', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('a:has-text("Profile")');
    await expect(page).toHaveURL(/\/profile/);
  });

  test('should display dashboard button on profile header', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to dashboard from profile header', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should display Q-cheque Profile text on profile page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Q-cheque Profile')).toBeVisible({ timeout: 15000 });
  });

  test('should logout and redirect to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have sticky header styling', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('nav.sticky');
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/sticky/);
    await expect(header).toHaveClass(/top-0/);
  });

  test('should have proper header styling across all pages', async ({ page }) => {
    const pages = ['/', '/login', '/register'];
    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      const header = page.locator('nav').first();
      await expect(header).toBeVisible();
      await expect(header).toHaveClass(/z-\[100\]/);
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('img[alt="Q-cheque"]').first()).toBeVisible();
    await expect(page.locator('a:has-text("Login")').first()).toBeVisible();
  });

  test('should have logout button with red styling', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toHaveClass(/text-red-600/);
    await expect(logoutButton).toHaveClass(/border-red-600/);
  });
});
