import { test, expect } from '@playwright/test';

test('Profile modal opens on click', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForSelector('text=Setting');
  
  // Click the profile capsule
  await page.click('text=Hassan');
  
  // Check if modal appears
  await expect(page.locator('text=Profile Customization')).toBeVisible();
});

