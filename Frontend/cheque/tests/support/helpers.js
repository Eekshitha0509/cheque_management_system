export async function loginAsUser(page, username = 'testuser', password = 'testpassword') {
  await page.goto('/login');
  await page.fill('input[placeholder="Username"]', username);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {});
}

export async function logoutUser(page) {
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
}

export async function navigateToDashboard(page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
}

export async function navigateToProfile(page) {
  await page.goto('/profile');
  await page.waitForLoadState('domcontentloaded');
}

export async function navigateToLogin(page) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
}

export async function navigateToRegister(page) {
  await page.goto('/register');
  await page.waitForLoadState('domcontentloaded');
}

export async function waitForLoadingToFinish(page, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const isLoading = await page.locator('.animate-spin').isVisible().catch(() => false);
    if (!isLoading) break;
    await page.waitForTimeout(500);
  }
}

export async function setAuthToken(page, token) {
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
  }, token);
}

export async function clearAuthToken(page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
}
