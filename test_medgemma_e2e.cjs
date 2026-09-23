const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log("=== STARTING MEDGEMMA SEAMLESS WORKFLOW E2E VERIFICATION ===");
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log("1. Navigating to http://127.0.0.1:5173...");
    await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2000));

    // Ensure assets directory exists
    const assetsDir = path.join(__dirname, "assets");
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    console.log("2. Switching to 'Pending Approval' tab and clicking case row...");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const pendingTab = tabs.find(t => t.textContent && t.textContent.includes('Pending Approval'));
      if (pendingTab) pendingTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Click the case row in the table
    const rowClicked = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      if (rows.length > 0) {
        rows[0].click();
        return true;
      }
      return false;
    });
    console.log("Clicked case row in table:", rowClicked);
    await new Promise(r => setTimeout(r, 3000));

    // Ensure Clinical Workspace sidebar is open (click toggle if collapsed)
    const openedSidebar = await page.evaluate(() => {
      const toggle = document.querySelector('button.fixed.top-1\\/2');
      if (toggle) {
        toggle.click();
        return true;
      }
      return false;
    });
    console.log("Opened sidebar via toggle if needed:", openedSidebar);
    await new Promise(r => setTimeout(r, 1500));

    // Ensure Report tab is selected
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reportBtn = btns.find(b => b.textContent && b.textContent.includes('Report'));
      if (reportBtn) reportBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log("3. Checking report state or triggering MedGemma Analysis...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => 
        b.textContent && (b.textContent.includes('Start MedGemma Analysis') || b.textContent.includes('Start Analysis'))
      );
      if (startBtn) startBtn.click();
    });

    // Wait for the report generation to complete
    console.log("Waiting for MedGemma report generation to settle...");
    await new Promise(r => setTimeout(r, 5000));

    // Check if report rendered
    const reportState = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasOverallImpression: text.includes("Overall Impression"),
        hasKeyObservations: text.includes("Key Observations"),
        hasLimitations: text.includes("Limitations"),
        hasSimulatedBanner: text.includes("Simulated Draft Report"),
        hasModelSetupBtn: text.includes("Model Setup"),
        hasSavePdfBtn: text.includes("Save as PDF"),
        hasSaveWithoutPdfBtn: text.includes("Save Without PDF"),
        hasBlockingSetupNotice: text.includes("MedGemma Model Setup Required")
      };
    });
    console.log("Report State Verification:", reportState);

    if (!reportState.hasOverallImpression) {
      throw new Error("Report failed to generate properly: " + JSON.stringify(reportState));
    }
    if (reportState.hasBlockingSetupNotice) {
      throw new Error("Blocking setup card is still visible! Must be non-blocking.");
    }

    await page.screenshot({ path: path.join(assetsDir, "medgemma-report-success.png") });
    console.log("Saved screenshot: assets/medgemma-report-success.png");

    // 4. Test Model Setup Modal
    console.log("4. Opening Model Setup modal...");
    const modelSetupClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const setupBtn = btns.find(b => b.textContent && b.textContent.includes('Model Setup'));
      if (setupBtn) {
        setupBtn.click();
        return true;
      }
      return false;
    });
    console.log("Clicked 'Model Setup' button:", modelSetupClicked);
    await new Promise(r => setTimeout(r, 1500));

    const modalState = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasModalTitle: text.includes("MedGemma Model Setup"),
        hasHfTokenInput: text.includes("HF_TOKEN") || text.includes("Hugging Face Access Token"),
        hasWeightsPathInput: text.includes("Custom Local Weights Path"),
        hasApiUrlInput: text.includes("External Inference API URL"),
        hasSaveApplyBtn: text.includes("Save & Apply")
      };
    });
    console.log("Model Setup Modal Verification:", modalState);

    if (!modalState.hasModalTitle || !modalState.hasHfTokenInput) {
      throw new Error("Model Setup Modal did not render correctly: " + JSON.stringify(modalState));
    }

    await page.screenshot({ path: path.join(assetsDir, "medgemma-model-setup-modal.png") });
    console.log("Saved screenshot: assets/medgemma-model-setup-modal.png");

    // Close the modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.textContent && b.textContent.trim() === 'Close');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    console.log("=== ALL END-TO-END MEDGEMMA WORKFLOW TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
