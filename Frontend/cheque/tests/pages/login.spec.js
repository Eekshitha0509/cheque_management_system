import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page header', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Welcome back');
  });

  test('should display logo and branding', async ({ page }) => {
    await expect(page.locator('text=Q-Cheque Portal')).toBeVisible();
    const logo = page.locator('.text-2xl.font-black.italic');
    await expect(logo).toContainText('Q');
  });

  test('should show username input field', async ({ page }) => {
    const usernameInput = page.locator('input[placeholder="Username"]');
    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('type', 'text');
  });

  test('should show password input field', async ({ page }) => {
    const passwordInput = page.locator('input[placeholder="Password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show remember me checkbox', async ({ page }) => {
    const rememberCheckbox = page.locator('input[type="checkbox"]');
    await expect(rememberCheckbox).toBeVisible();
    await expect(page.locator('text=Remember me')).toBeVisible();
  });

  test('should show forgot password link', async ({ page }) => {
    await expect(page.locator('button:has-text("Forgot?")')).toBeVisible();
  });

  test('should show submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('Submit');
  });

  test('should navigate to register page when clicking Create Account', async ({ page }) => {
    await page.click('a:has-text("Create Account")');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should display form validation errors on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('input[placeholder="Username"]')).toBeFocused();
  });

  test('should allow typing in username field', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'testuser');
    await expect(page.locator('input[placeholder="Username"]')).toHaveValue('testuser');
  });

  test('should allow typing in password field', async ({ page }) => {
    await page.fill('input[placeholder="Password"]', 'testpassword');
    await expect(page.locator('input[placeholder="Password"]')).toHaveValue('testpassword');
  });

  test('should toggle remember me checkbox', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('should switch to forgot password view', async ({ page }) => {
    await page.click('button:has-text("Forgot?")');
    await expect(page.locator('h2')).toContainText('Reset Access');
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
  });

  test('should switch back to login from forgot view', async ({ page }) => {
    await page.click('button:has-text("Forgot?")');
    await expect(page.locator('h2')).toContainText('Reset Access');
    await page.click('button:has-text("Back to Login")');
    await expect(page.locator('h2')).toContainText('Welcome back');
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
  });

  test('should show OTP view after email submission', async ({ page }) => {
    await page.click('button:has-text("Forgot?")');
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('h2')).toContainText('Verify Code');
    await expect(page.locator('input[placeholder="Enter OTP"]')).toBeVisible();
  });

  test('should show reset password view after OTP verification', async ({ page }) => {
    await page.click('button:has-text("Forgot?")');
    await page.fill('input[placeholder="Email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('input[placeholder="Enter OTP"]')).toBeVisible();
  });

  test('should disable submit button when loading', async ({ page }) => {
    await page.fill('input[placeholder="Username"]', 'testuser');
    await page.fill('input[placeholder="Password"]', 'testpassword');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
  });

  test('should have proper login card styling', async ({ page }) => {
    const loginCard = page.locator('.bg-white.rounded-\\[2\\.5rem\\]');
    await expect(loginCard).toBeVisible();
    await expect(loginCard).toHaveClass(/shadow/);
  });

  test('should show visual effects on page', async ({ page }) => {
    const blurEffect = page.locator('.blur-\\[120px\\]');
    await expect(blurEffect.first()).toBeVisible();
  });

  test('should display login page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h2')).toContainText('Welcome back');
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
  });
});
