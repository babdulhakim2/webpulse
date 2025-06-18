#!/usr/bin/env node
import express from 'express';
import bodyParser from 'body-parser';
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

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use('/screenshots', express.static(screenshotsDir));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Local Browser Debugger</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
          form { margin: 20px 0; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
          input[type="text"] { width: 100%; padding: 8px; margin: 10px 0; }
          button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
          button:hover { background: #45a049; }
          .screenshots { margin-top: 30px; }
          .screenshots img { max-width: 100%; margin-bottom: 20px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Local Browser Debugger</h1>
        <p>Enter a URL to create a debug report with screenshots, console logs, network requests, and performance metrics.</p>
        
        <form id="debugForm">
          <div>
            <label for="url">URL to debug:</label>
            <input type="text" id="url" name="url" placeholder="https://example.com" required>
          </div>
          <button type="submit">Create Debug Report</button>
        </form>
        
        <div class="result" id="result"></div>
        
        <script>
          document.getElementById('debugForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = document.getElementById('url').value;
            const resultDiv = document.getElementById('result');
            
            resultDiv.innerHTML = '<p>Launching browser and creating debug report... (this may take a few seconds)</p>';
            
            try {
              const response = await fetch('/debug', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                resultDiv.innerHTML = \`
                  <h2>Debug Report Created</h2>
                  <p>Your debug report is ready.</p>
                  <div class="screenshots">
                    <p><a href="\${data.reportUrl}" target="_blank">Open Full Debug Report</a></p>
                    <h3>Page Screenshot Preview</h3>
                    <img src="\${data.screenshotUrl}" alt="Page Screenshot">
                  </div>
                \`;
              } else {
                resultDiv.innerHTML = \`<p>Error: \${data.error}</p>\`;
              }
            } catch (error) {
              resultDiv.innerHTML = \`<p>Error: \${error.message}</p>\`;
            }
          });
        </script>
      </body>
    </html>
  `);
});

// Debug endpoint
app.post('/debug', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  let browser;
  try {
    console.log(`Creating debug report for URL: ${url}`);
    
    // Launch browser (headless mode for server)
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode for better performance
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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
      console.info('== DEBUG MODE ==');
      console.log('This is a log message');
      console.warn('This is a warning message');
      console.error('This is an error message');
    });
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Wait for the page to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate timestamp for filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pageScreenshotPath = path.join(screenshotsDir, `page-${timestamp}.png`);
    const pageScreenshotUrl = `/screenshots/page-${timestamp}.png`;
    
    // Take a screenshot of the page
    await page.screenshot({ 
      path: pageScreenshotPath, 
      fullPage: true 
    });
    
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
    }).catch(() => ({
      loadTime: 0,
      domContentLoaded: 0,
      firstPaint: 0,
      networkLatency: 0,
      domProcessingTime: 0
    }));
    
    // Extract page title
    const title = await page.title();
    
    // Create a debug report
    const debugReport = {
      url,
      title,
      timestamp: new Date().toISOString(),
      console: consoleLogs,
      network: requests.slice(0, 100), // Limit to first 100 requests
      performance: performanceMetrics
    };
    
    // Generate HTML report with embedded screenshot
    const reportPath = path.join(screenshotsDir, `debug-report-${timestamp}.html`);
    const reportUrl = `/screenshots/debug-report-${timestamp}.html`;
    
    // Create HTML report
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Debug Report for ${title || url}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
          h1, h2, h3 { margin-top: 20px; }
          .screenshot { max-width: 100%; border: 1px solid #ddd; margin: 20px 0; }
          .debug-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .console-log { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow: auto; max-height: 300px; }
          .network-panel { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow: auto; max-height: 600px; }
          .performance { background: #f8f8f8; padding: 10px; border-radius: 4px; }
          .log { margin: 5px 0; padding: 5px; border-radius: 3px; }
          .log-info { background: #e8f4fd; }
          .log-error { background: #fde8e8; }
          .log-warning { background: #fff8e8; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          
          /* Tabs for network requests */
          .tabs { display: flex; margin-bottom: 10px; }
          .tab { padding: 8px 16px; cursor: pointer; background: #eee; margin-right: 4px; border-radius: 4px 4px 0 0; }
          .tab.active { background: #f8f8f8; font-weight: bold; }
          .tab-content { display: none; }
          .tab-content.active { display: block; }
          
          /* Search box */
          .search-box { margin-bottom: 10px; }
          .search-box input { padding: 8px; width: 100%; }
        </style>
      </head>
      <body>
        <h1>Debug Report</h1>
        <p><strong>URL:</strong> <a href="${url}" target="_blank">${url}</a></p>
        <p><strong>Title:</strong> ${title || 'N/A'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        
        <h2>Screenshot</h2>
        <img class="screenshot" src="page-${timestamp}.png" alt="Page Screenshot">
        
        <div class="debug-grid">
          <div>
            <h2>Console Logs (${debugReport.console.length})</h2>
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
        
        <h2>Network Requests (${debugReport.network.length})</h2>
        
        <div class="search-box">
          <input type="text" id="network-search" placeholder="Search requests...">
        </div>
        
        <div class="tabs">
          <div class="tab active" data-tab="all">All</div>
          ${Array.from(new Set(debugReport.network.map(req => req.resourceType))).map(type => 
            `<div class="tab" data-tab="${type}">${type}</div>`
          ).join('')}
        </div>
        
        <div class="network-panel">
          <div id="all" class="tab-content active">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Method</th>
                  <th>URL</th>
                </tr>
              </thead>
              <tbody id="network-table">
                ${debugReport.network.map(req => `
                  <tr data-url="${req.url}" data-type="${req.resourceType}">
                    <td>${req.resourceType}</td>
                    <td>${req.method}</td>
                    <td>${req.url}</td>
                  </tr>
                `).join('')}
                ${debugReport.network.length === 0 ? '<tr><td colspan="3">No network requests recorded.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
          
          ${Array.from(new Set(debugReport.network.map(req => req.resourceType))).map(type => `
            <div id="${type}" class="tab-content">
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  ${debugReport.network.filter(req => req.resourceType === type).map(req => `
                    <tr data-url="${req.url}" data-type="${req.resourceType}">
                      <td>${req.method}</td>
                      <td>${req.url}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
        
        <script>
          // Tab functionality
          document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
              // Remove active class from all tabs and contents
              document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
              document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
              
              // Add active class to clicked tab and its content
              tab.classList.add('active');
              document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
            });
          });
          
          // Search functionality
          document.getElementById('network-search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('#network-table tr').forEach(row => {
              const url = row.getAttribute('data-url').toLowerCase();
              const type = row.getAttribute('data-type').toLowerCase();
              
              if (url.includes(searchTerm) || type.includes(searchTerm)) {
                row.style.display = '';
              } else {
                row.style.display = 'none';
              }
            });
          });
        </script>
      </body>
      </html>
    `;
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`Debug report saved to: ${reportPath}`);
    
    // Return the URLs
    res.json({
      success: true,
      screenshotUrl: pageScreenshotUrl,
      reportUrl: reportUrl,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Error creating debug report:', error);
    res.status(500).json({ 
      error: `Failed to create debug report: ${error.message}` 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Local Browser Debugger server running at http://localhost:${PORT}`);
  console.log(`Screenshots and reports will be saved to: ${screenshotsDir}`);
}); 