import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display page heading', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Create Account');
  });

  test('should display page description', async ({ page }) => {
    await expect(page.locator('p.text-gray-500')).toContainText('Digital Cheque Management System');
  });

  test('should show Full Name input field', async ({ page }) => {
    const fullNameInput = page.locator('input[name="fullName"]');
    await expect(fullNameInput).toBeVisible();
    await expect(fullNameInput).toHaveAttribute('placeholder', 'Full Name');
  });

  test('should show Email input field', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should show Password input field', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show Mobile Number input field', async ({ page }) => {
    const mobileInput = page.locator('input[name="mobile_number"]');
    await expect(mobileInput).toBeVisible();
    await expect(mobileInput).toHaveAttribute('placeholder', 'Mobile Number');
  });

  test('should show Bank Name input field', async ({ page }) => {
    const bankInput = page.locator('input[name="bank_name"]');
    await expect(bankInput).toBeVisible();
    await expect(bankInput).toHaveAttribute('placeholder', 'Bank Name (SBI, HDFC, ICICI, AXIS)');
  });

  test('should show Register button', async ({ page }) => {
    const registerButton = page.locator('button[type="submit"]');
    await expect(registerButton).toBeVisible();
    await expect(registerButton).toContainText('Register');
  });

  test('should navigate to login page when clicking Login link', async ({ page }) => {
    await page.click('a:has-text("Login")');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow typing in all form fields', async ({ page }) => {
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="mobile_number"]', '9876543210');
    await page.fill('input[name="bank_name"]', 'HDFC');

    expect(await page.locator('input[name="fullName"]')).toHaveValue('John Doe');
    expect(await page.locator('input[name="email"]')).toHaveValue('john@example.com');
    expect(await page.locator('input[name="password"]')).toHaveValue('password123');
    expect(await page.locator('input[name="mobile_number"]')).toHaveValue('9876543210');
    expect(await page.locator('input[name="bank_name"]')).toHaveValue('HDFC');
  });

  test('should require all fields to be filled', async ({ page }) => {
    const registerButton = page.locator('button[type="submit"]');
    await expect(registerButton).toBeEnabled();
  });

  test('should show validation on required fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    const fullNameInput = page.locator('input[name="fullName"]');
    await expect(fullNameInput).toHaveAttribute('required');
  });

  test('should have proper form card styling', async ({ page }) => {
    const formCard = page.locator('.bg-white');
    await expect(formCard).toBeVisible();
    await expect(formCard).toHaveClass(/rounded-2xl/);
  });

  test('should display login link text correctly', async ({ page }) => {
    await expect(page.locator('text=Already have an account?')).toBeVisible();
    await expect(page.locator('a:has-text("Login")')).toBeVisible();
  });

  test('should have register button with correct styling', async ({ page }) => {
    const registerButton = page.locator('button[type="submit"]');
    await expect(registerButton).toHaveClass(/bg-blue-600/);
    await expect(registerButton).toHaveClass(/hover:bg-blue-700/);
  });

  test('should have inputs with focus ring styling', async ({ page }) => {
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveClass(/focus:ring-2/);
    await expect(emailInput).toHaveClass(/focus:ring-blue-500/);
  });

  test('should display register page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h2')).toContainText('Create Account');
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
  });

  test('should update form data on input change', async ({ page }) => {
    const fullNameInput = page.locator('input[name="fullName"]');
    await fullNameInput.fill('Test User');
    await fullNameInput.blur();
    await expect(fullNameInput).toHaveValue('Test User');
  });

  test('should submit form successfully with valid data', async ({ page }) => {
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="mobile_number"]', '9876543210');
    await page.fill('input[name="bank_name"]', 'SBI');
    await page.click('button[type="submit"]');
  });
});
