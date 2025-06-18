#!/usr/bin/env node
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Get URL from command line or use default
const url = process.argv[2] || 'https://example.com';
console.log(`Opening URL: ${url}`);

/**
 * Takes a screenshot of a browser page and collects debug information
 */
async function captureWithDebugInfo() {
  let browser;
  try {
    console.log('Launching browser...');
    
    // Launch a headless browser for more reliability
    browser = await puppeteer.launch({
      headless: false, // Use real browser for visibility
      args: ['--window-size=1600,1200']
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: 1280,
      height: 800
    });
    
    // Collect console logs
    const consoleLogs = [];
    page.on('console', message => {
      consoleLogs.push({
        type: message.type(),
        text: message.text(),
        time: new Date().toISOString()
      });
    });
    
    // Collect network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        time: new Date().toISOString()
      });
    });
    
    // Inject some console messages for testing
    await page.evaluate(() => {
      console.log('This is a log message');
      console.warn('This is a warning message');
      console.error('This is an error message');
    });
    
    console.log(`Navigating to ${url}...`);
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Wait a bit for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate timestamp for filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Take a screenshot of the page
    const pageScreenshotPath = path.join(screenshotsDir, `page-${timestamp}.png`);
    await page.screenshot({ 
      path: pageScreenshotPath, 
      fullPage: true 
    });
    console.log(`Page screenshot saved to: ${pageScreenshotPath}`);
    
    // Collect performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      const navStart = perfData.navigationStart;
      
      return {
        loadTime: perfData.loadEventEnd - navStart,
        domContentLoaded: perfData.domContentLoadedEventEnd - navStart,
        firstPaint: perfData.responseEnd - navStart,
        networkLatency: perfData.responseEnd - perfData.requestStart,
        domProcessingTime: perfData.domComplete - perfData.domLoading
      };
    });
    
    // Create a debug report
    const debugReport = {
      url,
      timestamp: new Date().toISOString(),
      console: consoleLogs,
      network: requests.slice(0, 50), // Limit to first 50 requests
      performance: performanceMetrics
    };
    
    // Generate HTML report with embedded screenshot
    const reportPath = path.join(screenshotsDir, `debug-report-${timestamp}.html`);
    
    // Create an HTML debug report
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Debug Report for ${url}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
          h1, h2, h3 { margin-top: 20px; }
          .screenshot { max-width: 100%; border: 1px solid #ddd; margin: 20px 0; }
          .debug-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .console-log { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow: auto; max-height: 300px; }
          .network-panel { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow: auto; max-height: 300px; }
          .performance { background: #f8f8f8; padding: 10px; border-radius: 4px; }
          .log { margin: 5px 0; padding: 5px; border-radius: 3px; }
          .log-info { background: #e8f4fd; }
          .log-error { background: #fde8e8; }
          .log-warning { background: #fff8e8; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Debug Report</h1>
        <p><strong>URL:</strong> ${url}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        
        <h2>Screenshot</h2>
        <img class="screenshot" src="page-${timestamp}.png" alt="Page Screenshot">
        
        <div class="debug-grid">
          <div>
            <h2>Console Logs</h2>
            <div class="console-log">
              ${debugReport.console.map(log => `
                <div class="log log-${log.type}">
                  <strong>[${log.type}]</strong> ${log.text}
                </div>
              `).join('')}
              ${debugReport.console.length === 0 ? '<p>No console logs recorded.</p>' : ''}
            </div>
          </div>
          
          <div>
            <h2>Performance Metrics</h2>
            <div class="performance">
              <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Load Time</td><td>${performanceMetrics.loadTime} ms</td></tr>
                <tr><td>DOM Content Loaded</td><td>${performanceMetrics.domContentLoaded} ms</td></tr>
                <tr><td>First Paint (approx)</td><td>${performanceMetrics.firstPaint} ms</td></tr>
                <tr><td>Network Latency</td><td>${performanceMetrics.networkLatency} ms</td></tr>
                <tr><td>DOM Processing</td><td>${performanceMetrics.domProcessingTime} ms</td></tr>
              </table>
            </div>
          </div>
        </div>
        
        <h2>Network Requests (first ${debugReport.network.length} requests)</h2>
        <div class="network-panel">
          <table>
            <tr>
              <th>Type</th>
              <th>Method</th>
              <th>URL</th>
            </tr>
            ${debugReport.network.map(req => `
              <tr>
                <td>${req.resourceType}</td>
                <td>${req.method}</td>
                <td>${req.url}</td>
              </tr>
            `).join('')}
            ${debugReport.network.length === 0 ? '<tr><td colspan="3">No network requests recorded.</td></tr>' : ''}
          </table>
        </div>
      </body>
      </html>
    `;
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`Debug report saved to: ${reportPath}`);
    
    // Open the debug report in the browser
    const reportPage = await browser.newPage();
    await reportPage.goto(`file://${reportPath}`);
    console.log('Debug report opened in browser');
    
    // Keep browser open for 30 seconds so you can view the report
    console.log('Browser will close in 30 seconds... Review the report before it closes.');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    return {
      pageScreenshotPath,
      reportPath
    };
  } catch (error) {
    console.error('Error capturing debug info:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed');
    }
  }
}

// Execute the function
captureWithDebugInfo()
  .then(paths => {
    console.log('Debug completed successfully:');
    console.log(`- Page screenshot: ${paths.pageScreenshotPath}`);
    console.log(`- Debug report: ${paths.reportPath}`);
    console.log('You can find these files in the screenshots directory.');
  })
  .catch(error => {
    console.error('Failed to capture debug information:', error);
    process.exit(1);
  }); 