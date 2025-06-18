#!/usr/bin/env node
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get URL from command line arguments
const url = process.argv[2];
if (!url) {
  console.error('Please provide a URL as an argument');
  console.error('Example: node debug-capture.js https://example.com');
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
const outputPath = path.join(outputDir, `debug-${timestamp}`);
if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const htmlReportPath = path.join(outputPath, 'report.html');

async function captureDebugInfo() {
  console.log(`Starting advanced debug capture for ${url}`);
  
  // Launch the browser with DevTools protocol enabled
  const browser = await puppeteer.launch({
    headless: false, // Need a real browser to capture debugger
    devtools: true,  // Open DevTools automatically
    args: [
      '--no-sandbox',
      '--disable-web-security',
      '--auto-open-devtools-for-tabs'
    ]
  });
  
  try {
    // Create a new page
    const page = await browser.newPage();
    
    // Create CDP (Chrome DevTools Protocol) session
    const client = await page.target().createCDPSession();
    
    // Enable various debugger domains
    await client.send('Network.enable');
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Debugger.enable');
    
    // Capture console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log(`Console: ${text}`);
    });
    
    // Capture network requests
    const networkRequests = [];
    client.on('Network.requestWillBeSent', request => {
      networkRequests.push({
        url: request.request.url,
        method: request.request.method,
        type: request.type,
        timestamp: request.timestamp
      });
    });
    
    // Capture network responses
    const networkResponses = [];
    client.on('Network.responseReceived', response => {
      networkResponses.push({
        url: response.response.url,
        status: response.response.status,
        mimeType: response.response.mimeType,
        timestamp: response.timestamp
      });
    });
    
    // Capture JavaScript exceptions
    const exceptions = [];
    client.on('Runtime.exceptionThrown', exception => {
      exceptions.push({
        text: exception.exceptionDetails.text,
        lineNumber: exception.exceptionDetails.lineNumber,
        url: exception.exceptionDetails.url,
        timestamp: exception.timestamp
      });
    });
    
    // Capture debugger pauses
    client.on('Debugger.paused', async (params) => {
      console.log('Debugger paused!');
      console.log('Reason:', params.reason);
      
      // This will extract the call stack when the debugger is paused
      const callFrames = params.callFrames.map(frame => ({
        functionName: frame.functionName,
        location: {
          scriptId: frame.location.scriptId,
          lineNumber: frame.location.lineNumber,
          columnNumber: frame.location.columnNumber
        },
        url: frame.url
      }));
      
      fs.writeFileSync(
        path.join(outputPath, 'callstack.json'), 
        JSON.stringify(callFrames, null, 2)
      );
      
      // Take a screenshot when debugger is paused
      await page.screenshot({ 
        path: path.join(outputPath, 'debugger-paused.png'),
        fullPage: false 
      });
      
      // Wait for user to interact then continue
      console.log('Waiting for you to inspect the page. Press any key to continue...');
      process.stdin.setRawMode(true);
      await new Promise(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
      }));
      
      // Continue execution
      await client.send('Debugger.resume');
    });
    
    // Navigate to the URL
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Take a full page screenshot
    console.log('Taking initial screenshot...');
    await page.screenshot({ 
      path: path.join(outputPath, 'screenshot.png'),
      fullPage: true
    });
    
    // Allow time for user to interact and potentially trigger debugger
    console.log('\n*************************************************************');
    console.log('* The browser is now open with DevTools. You can:');
    console.log('* 1. Add breakpoints in the Sources panel');
    console.log('* 2. Trigger events on the page');
    console.log('* 3. When paused at a breakpoint, the state will be captured');
    console.log('*');
    console.log('* Press Ctrl+C when you\'re done to generate the report');
    console.log('*************************************************************\n');
    
    // Wait for user to signal completion (Ctrl+C handled in the process.on('SIGINT') handler)
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\nCapturing final state and generating report...');
        resolve();
      });
    });
    
    // Take a final screenshot
    await page.screenshot({ 
      path: path.join(outputPath, 'final-screenshot.png'),
      fullPage: true
    });
    
    // Save collected data
    fs.writeFileSync(
      path.join(outputPath, 'console-logs.txt'), 
      consoleLogs.join('\n')
    );
    
    fs.writeFileSync(
      path.join(outputPath, 'network-requests.json'), 
      JSON.stringify(networkRequests, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputPath, 'network-responses.json'), 
      JSON.stringify(networkResponses, null, 2)
    );
    
    fs.writeFileSync(
      path.join(outputPath, 'exceptions.json'), 
      JSON.stringify(exceptions, null, 2)
    );
    
    // Get page metrics
    const metrics = await page.metrics();
    fs.writeFileSync(
      path.join(outputPath, 'metrics.json'), 
      JSON.stringify(metrics, null, 2)
    );
    
    // Create HTML report
    console.log('Creating HTML report...');
    
    const hasBreakpointImage = fs.existsSync(path.join(outputPath, 'debugger-paused.png'));
    
    const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Debug Report for ${url}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        img { max-width: 100%; border: 1px solid #ddd; margin-bottom: 20px; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px; border-radius: 4px; }
        h1, h2, h3 { margin-top: 30px; }
        .tabs { display: flex; margin-bottom: 1px; }
        .tab { padding: 10px 15px; cursor: pointer; background: #f1f1f1; margin-right: 5px; border-radius: 5px 5px 0 0; }
        .tab.active { background: #ddd; }
        .tab-content { display: none; padding: 15px; background: #f9f9f9; border-radius: 0 5px 5px 5px; }
        .tab-content.active { display: block; }
        .highlight { background-color: #ffffcc; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .screenshots-container { display: flex; flex-wrap: wrap; gap: 20px; }
        .screenshot-box { flex: 1; min-width: 300px; }
      </style>
      <script>
        function openTab(evt, tabName) {
          const tabcontent = document.getElementsByClassName("tab-content");
          for (let i = 0; i < tabcontent.length; i++) {
            tabcontent[i].classList.remove("active");
          }
          
          const tablinks = document.getElementsByClassName("tab");
          for (let i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
          }
          
          document.getElementById(tabName).classList.add("active");
          evt.currentTarget.classList.add("active");
        }
        
        function searchTable(inputId, tableId) {
          const input = document.getElementById(inputId);
          const filter = input.value.toUpperCase();
          const table = document.getElementById(tableId);
          const tr = table.getElementsByTagName("tr");
          
          for (let i = 1; i < tr.length; i++) {
            let txtValue = tr[i].textContent || tr[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
              tr[i].style.display = "";
            } else {
              tr[i].style.display = "none";
            }
          }
        }
        
        window.onload = function() {
          document.querySelector('.tab').click();
        }
      </script>
    </head>
    <body>
      <h1>Interactive Debug Report for ${url}</h1>
      <p>Generated at: ${new Date().toISOString()}</p>
      
      <div class="tabs">
        <button class="tab" onclick="openTab(event, 'screenshots')">Screenshots</button>
        <button class="tab" onclick="openTab(event, 'console')">Console Logs</button>
        <button class="tab" onclick="openTab(event, 'network')">Network</button>
        <button class="tab" onclick="openTab(event, 'exceptions')">Exceptions</button>
        <button class="tab" onclick="openTab(event, 'metrics')">Metrics</button>
        ${hasBreakpointImage ? '<button class="tab" onclick="openTab(event, \'debugger\')">Debugger</button>' : ''}
      </div>
      
      <div id="screenshots" class="tab-content">
        <h2>Page Screenshots</h2>
        <div class="screenshots-container">
          <div class="screenshot-box">
            <h3>Initial State</h3>
            <img src="screenshot.png" alt="Initial Screenshot">
          </div>
          <div class="screenshot-box">
            <h3>Final State</h3>
            <img src="final-screenshot.png" alt="Final Screenshot">
          </div>
        </div>
      </div>
      
      <div id="console" class="tab-content">
        <h2>Console Logs (${consoleLogs.length})</h2>
        <input type="text" id="consoleSearch" onkeyup="searchTable('consoleSearch', 'consoleTable')" placeholder="Search logs...">
        <pre>${consoleLogs.join('\n')}</pre>
      </div>
      
      <div id="network" class="tab-content">
        <h2>Network Requests (${networkRequests.length})</h2>
        <input type="text" id="networkSearch" onkeyup="searchTable('networkSearch', 'networkTable')" placeholder="Search requests...">
        
        <table id="networkTable">
          <tr>
            <th>Method</th>
            <th>URL</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
          ${networkRequests.map((req, i) => {
            const resp = networkResponses.find(r => r.url === req.url) || {};
            return `<tr>
              <td>${req.method}</td>
              <td>${req.url.substring(0, 100)}${req.url.length > 100 ? '...' : ''}</td>
              <td>${req.type || 'N/A'}</td>
              <td>${resp.status || 'N/A'}</td>
            </tr>`;
          }).join('')}
        </table>
      </div>
      
      <div id="exceptions" class="tab-content">
        <h2>JavaScript Exceptions (${exceptions.length})</h2>
        ${exceptions.length > 0 ? 
          `<ul>${exceptions.map(e => `<li><strong>${e.text}</strong> at line ${e.lineNumber} in ${e.url || 'unknown source'}</li>`).join('')}</ul>` : 
          '<p>No exceptions detected</p>'}
      </div>
      
      <div id="metrics" class="tab-content">
        <h2>Page Metrics</h2>
        <pre>${fs.existsSync(path.join(outputPath, 'metrics.json')) ? 
          JSON.stringify(JSON.parse(fs.readFileSync(path.join(outputPath, 'metrics.json'))), null, 2) : 
          'Metrics not available'}</pre>
      </div>
      
      ${hasBreakpointImage ? `
      <div id="debugger" class="tab-content">
        <h2>Debugger Paused State</h2>
        <h3>Screenshot at Breakpoint</h3>
        <img src="debugger-paused.png" alt="Debugger Paused Screenshot">
        
        <h3>Call Stack</h3>
        <pre>${fs.existsSync(path.join(outputPath, 'callstack.json')) ? 
          JSON.stringify(JSON.parse(fs.readFileSync(path.join(outputPath, 'callstack.json'))), null, 2) : 
          'Call stack not available'}</pre>
      </div>` : ''}
    </body>
    </html>
    `;
    
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log('Debug capture complete!');
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