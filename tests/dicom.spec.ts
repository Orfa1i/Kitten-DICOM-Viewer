import { test, expect } from '@playwright/test';

test('DICOM Viewer Integration Test - Standalone Studio', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => { 
    errors.push(err.message); 
    console.error('PAGE ERROR:', err.message);
  });
  
  // Navigate directly to the standalone Studio Workstation
  await page.goto('/?view=studio', { waitUntil: 'commit' });

  // Wait for the app to render the Diagnostic Studio header
  await page.waitForSelector('text=Diagnostic Studio PRO', { timeout: 30000 });

  // Verify DICOM Metadata sidebar exists
  await expect(page.locator('text=DICOM Metadata')).toBeVisible();

  // Check if Cornerstone3D mounted correctly (viewport canvas should exist)
  const canvas = page.locator('.oncontextmenu-none canvas');
  await expect(canvas.first()).toBeVisible({ timeout: 10000 });

  // Verify all tool buttons are rendered
  const tools = ['Window / Level', 'Pan', 'Zoom', 'Measure Length', 'Probe', 'Rectangle ROI', 'Elliptical ROI', 'Arrow Annotation'];
  for (const tool of tools) {
    const btn = page.locator(`button[title="${tool}"]`);
    await expect(btn).toBeVisible();
  }

  // Click a tool to ensure no errors throw on state change
  const lengthToolBtn = page.locator('button[title="Measure Length"]');
  await lengthToolBtn.click();
  await page.waitForTimeout(1000);

  // Write a note in the case notes to ensure interaction
  const notesArea = page.locator('textarea[placeholder*="Write diagnostic observations"]');
  await notesArea.fill('Test diagnostic note for validation.');

  // Verify no page errors occurred during the entire lifecycle
  expect(errors).toHaveLength(0);
});
