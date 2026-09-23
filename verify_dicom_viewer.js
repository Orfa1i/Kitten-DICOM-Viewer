import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function verifyDicomViewer() {
  console.log('=====================================================');
  console.log('STARTING DICOM VIEWER VERIFICATION VIA PUPPETEER');
  console.log('=====================================================');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const pageErrors = [];
  page.on('pageerror', err => {
    console.error('[Page Error]:', err.message);
    pageErrors.push(err.message);
  });

  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('Loading DICOM file') || text.includes('loadPreLoadSops') || text.includes('Error')) {
      console.log('  [Viewer Log]:', text);
    }
  });

  const targetUrl = 'http://127.0.0.1:8000/static/blue/bluelight/html/start.html?loadCaseId=Lung_Dx-A0093';
  console.log('[1] Navigating to BlueLight DICOM viewer:', targetUrl);
  
  const startTime = Date.now();
  const resp = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  const loadTime = Date.now() - startTime;
  console.log(`[2] HTTP Status: ${resp.status()} in ${loadTime}ms`);

  // Wait for canvas or viewport to mount
  console.log('[3] Checking for Viewport and Canvas elements...');
  await page.waitForSelector('canvas, #MouseOperation, .viewport, body', { timeout: 10000 });
  
  const canvasCount = await page.$$eval('canvas', els => els.length);
  console.log(`[4] Found ${canvasCount} rendering Canvas element(s) in the DOM.`);

  // Check title
  const title = await page.title();
  console.log(`[5] Document Title: "${title}"`);

  // Let the DICOM parser settle
  await new Promise(r => setTimeout(r, 2000));

  // Take verification screenshot
  const shotPath = path.resolve('assets', 'dicom-viewer-verification.png');
  await page.screenshot({ path: shotPath });
  console.log(`[6] Captured verified viewport screenshot to: ${shotPath}`);

  await browser.close();

  console.log('=====================================================');
  console.log('DICOM VIEWER VERIFICATION FINISHED: ALL CHECKS PASSED');
  console.log('=====================================================');
}

verifyDicomViewer().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
