#!/bin/bash

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Please provide a URL to capture."
  echo "Usage: ./enhanced-capture.sh https://example.com"
  exit 1
fi

URL="$1"
TIMESTAMP=$(date +%s)
OUTPUT_DIR="./debug-output-$TIMESTAMP"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "==============================================="
echo "  Enhanced Website Debugging Tool"
echo "==============================================="
echo "URL: $URL"
echo "Output directory: $OUTPUT_DIR"
echo

# 1. Basic curl request to get HTTP headers
echo "Fetching HTTP headers..."
curl -s -I "$URL" > "$OUTPUT_DIR/headers.txt"
echo "Headers saved to $OUTPUT_DIR/headers.txt"

# 2. Fetch the HTML content
echo "Fetching HTML content..."
curl -s "$URL" > "$OUTPUT_DIR/content.html"
echo "HTML content saved to $OUTPUT_DIR/content.html"

# 3. Run dig to check DNS information
echo "Checking DNS information..."
dig +short "$URL" > "$OUTPUT_DIR/dns.txt"
echo "DNS information saved to $OUTPUT_DIR/dns.txt"

# 4. Get traceroute information
echo "Running traceroute..."
traceroute -m 15 $(echo "$URL" | sed -E 's/^https?:\/\///' | sed -E 's/\/.*$//') > "$OUTPUT_DIR/traceroute.txt" 2>/dev/null
echo "Traceroute information saved to $OUTPUT_DIR/traceroute.txt"

# 5. Run curl with timing information
echo "Fetching with timing information..."
curl -s -w '\nLookup time: %{time_namelookup}s\nConnect time: %{time_connect}s\nTLS setup: %{time_appconnect}s\nPretransfer time: %{time_pretransfer}s\nStart transfer time: %{time_starttransfer}s\nTotal time: %{time_total}s\n' "$URL" > "$OUTPUT_DIR/timing.txt"
echo "Timing information saved to $OUTPUT_DIR/timing.txt"

# 6. Network information
echo "Checking network interfaces..."
ifconfig > "$OUTPUT_DIR/ifconfig.txt" 2>/dev/null
echo "Network interface information saved to $OUTPUT_DIR/ifconfig.txt"

# 7. Check for a Chrome installation and take screenshots
if [ -d "/Applications/Google Chrome.app" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  echo "Found Chrome. Taking screenshots..."
  
  # Regular screenshot
  "$CHROME" --headless --disable-gpu --screenshot="$OUTPUT_DIR/screenshot.png" --window-size=1280,800 "$URL"
  echo "Screenshot saved to $OUTPUT_DIR/screenshot.png"
  
  # Mobile emulation screenshot
  "$CHROME" --headless --disable-gpu --screenshot="$OUTPUT_DIR/mobile-screenshot.png" --window-size=375,812 --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1" "$URL"
  echo "Mobile screenshot saved to $OUTPUT_DIR/mobile-screenshot.png"
  
  # Get the DOM content
  "$CHROME" --headless --disable-gpu --dump-dom "$URL" > "$OUTPUT_DIR/dom.html"
  echo "DOM content saved to $OUTPUT_DIR/dom.html"
  
  # Run Lighthouse audit if available
  if command -v lighthouse &> /dev/null; then
    echo "Running Lighthouse audit..."
    lighthouse "$URL" --output html --output-path "$OUTPUT_DIR/lighthouse-report.html" --chrome-flags="--headless --disable-gpu" --quiet
    echo "Lighthouse report saved to $OUTPUT_DIR/lighthouse-report.html"
  else
    echo "Lighthouse not found. Skipping performance audit."
  fi
elif [ -d "/Applications/Safari.app" ]; then
  echo "Chrome not found. Using Safari to open the URL..."
  open -a Safari "$URL"
  echo "Please take a screenshot manually."
else
  echo "Chrome or Safari not found. Cannot take screenshot automatically."
fi

# 8. Create a simple HTML report
cat > "$OUTPUT_DIR/report.html" << HTML
<!DOCTYPE html>
<html>
<head>
  <title>Debug Report for $URL</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    img { max-width: 100%; border: 1px solid #ddd; margin-bottom: 20px; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; max-height: 400px; border-radius: 4px; }
    h1, h2 { margin-top: 30px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .timing { font-family: monospace; background: #f0f0f0; padding: 15px; border-radius: 4px; }
    .highlight { background-color: #ffffcc; }
    .screenshots-container { display: flex; flex-wrap: wrap; gap: 20px; }
    .screenshot-box { flex: 1; min-width: 300px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>Debug Report for $URL</h1>
  <p>Generated at: $(date)</p>
  
  <h2>Screenshots</h2>
  <div class="screenshots-container">
    <div class="screenshot-box">
      <h3>Desktop View (1280x800)</h3>
      <img src="screenshot.png" alt="Desktop Screenshot">
    </div>
    <div class="screenshot-box">
      <h3>Mobile View (iPhone X)</h3>
      <img src="mobile-screenshot.png" alt="Mobile Screenshot">
    </div>
  </div>
  
  <div class="grid">
    <div>
      <h2>Performance Metrics</h2>
      <div class="timing">
      $(cat "$OUTPUT_DIR/timing.txt" | grep -E 'Lookup|Connect|TLS|Total')
      </div>
      
      <h2>HTTP Headers</h2>
      <pre>$(cat "$OUTPUT_DIR/headers.txt")</pre>
    </div>
    
    <div>
      <h2>DNS Information</h2>
      <pre>$(cat "$OUTPUT_DIR/dns.txt")</pre>
      
      <h2>Network Path</h2>
      <pre>$(cat "$OUTPUT_DIR/traceroute.txt" | head -n 15)</pre>
    </div>
  </div>
  
  <h2>HTML Content</h2>
  <pre>$(cat "$OUTPUT_DIR/content.html" | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g' | head -n 200)
  ... (content truncated, see full content in content.html) ...</pre>
  
  <h2>Links to Reports</h2>
  <ul>
    <li><a href="dom.html" target="_blank">Full DOM Snapshot</a></li>
    $(if [ -f "$OUTPUT_DIR/lighthouse-report.html" ]; then echo '<li><a href="lighthouse-report.html" target="_blank">Lighthouse Performance Report</a></li>'; fi)
    <li><a href="content.html" target="_blank">Raw HTML Content</a></li>
  </ul>
</body>
</html>
HTML

echo "Enhanced HTML report created at $OUTPUT_DIR/report.html"

# Open the report
echo "Opening report in browser..."
open "$OUTPUT_DIR/report.html"

echo "Enhanced debug capture complete!"
echo "All debug information is saved in: $OUTPUT_DIR" 