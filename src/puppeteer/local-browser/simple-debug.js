#!/usr/bin/env node
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get URL from command line arguments
const url = process.argv[2];
if (!url) {
  console.error('Please provide a URL as an argument');
  console.error('Example: node simple-debug.js https://example.com');
  process.exit(1);
}

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'debug-output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate timestamp and filenames
const timestamp = Date.now();
const screenshotPath = path.join(outputDir, `screenshot-${timestamp}.png`);
const consoleLogPath = path.join(outputDir, `console-${timestamp}.txt`);
const networkLogPath = path.join(outputDir, `network-${timestamp}.txt`);
const htmlReportPath = path.join(outputDir, `report-${timestamp}.html`);

async function captureDebugInfo() {
  console.log(`Starting debug capture for ${url}`);
  console.log('Using fully headless mode to avoid WebSocket issues');
  
  const browser = await puppeteer.launch({
    headless: 'new', // Use the new headless mode
    args: ['--no-sandbox']
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Collect console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log(`Console: ${text}`);
    });
    
    // Collect network requests
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    // Navigate to the URL with a good timeout
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait a bit for everything to load
    console.log('Waiting for page to stabilize...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Take a screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true
    });
    
    // Save console logs to file
    fs.writeFileSync(consoleLogPath, consoleLogs.join('\n'));
    
    // Save network requests to file
    fs.writeFileSync(networkLogPath, JSON.stringify(networkRequests, null, 2));
    
    // Create simple HTML report
    const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Debug Report for ${url}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        img { max-width: 100%; border: 1px solid #ddd; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
      </style>
    </head>
    <body>
      <h1>Debug Report for ${url}</h1>
      <p>Generated at: ${new Date().toISOString()}</p>
      
      <h2>Screenshot</h2>
      <img src="screenshot-${timestamp}.png" alt="Page Screenshot">
      
      <h2>Console Logs (${consoleLogs.length})</h2>
      <pre>${consoleLogs.join('\n')}</pre>
      
      <h2>Network Requests (${networkRequests.length})</h2>
      <pre>${JSON.stringify(networkRequests.slice(0, 50), null, 2)}</pre>
    </body>
    </html>
    `;
    
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log('Debug capture complete!');
    console.log(`Screenshot: ${screenshotPath}`);
    console.log(`Console logs: ${consoleLogPath}`);
    console.log(`Network logs: ${networkLogPath}`);
    console.log(`HTML Report: ${htmlReportPath}`);
    
    // Open the HTML report in the default browser
    console.log('Opening HTML report...');
    const open = (await import('open')).default;
    await open(`file://${htmlReportPath}`);
    
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the debug function
captureDebugInfo()
  .catch(error => {
    console.error('Error during debug capture:', error);
    process.exit(1);
  }); 