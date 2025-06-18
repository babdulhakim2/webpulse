#!/bin/bash

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Please provide a URL to capture."
  echo "Usage: ./capture.sh https://example.com"
  exit 1
fi

URL="$1"
TIMESTAMP=$(date +%s)
OUTPUT_DIR="./debug-output-$TIMESTAMP"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "==============================================="
echo "  Website Debugging Tool"
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

# 3. Check for a Safari or Chrome installation
if [ -d "/Applications/Google Chrome.app" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  echo "Found Chrome. Taking screenshot..."
  
  "$CHROME" --headless --disable-gpu --screenshot="$OUTPUT_DIR/screenshot.png" --window-size=1280,800 "$URL"
  echo "Screenshot saved to $OUTPUT_DIR/screenshot.png"
elif [ -d "/Applications/Safari.app" ]; then
  echo "Chrome not found. Using Safari to open the URL..."
  open -a Safari "$URL"
  echo "Please take a screenshot manually."
else
  echo "Chrome or Safari not found. Cannot take screenshot automatically."
fi

# 4. Create a simple HTML report
cat > "$OUTPUT_DIR/report.html" << HTML
<!DOCTYPE html>
<html>
<head>
  <title>Debug Report for $URL</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    img { max-width: 100%; border: 1px solid #ddd; }
    pre { background: #f5f5f5; padding: 10px; overflow: auto; max-height: 500px; }
    h1, h2 { margin-top: 30px; }
  </style>
</head>
<body>
  <h1>Debug Report for $URL</h1>
  <p>Generated at: $(date)</p>
  
  <h2>Screenshot</h2>
  <img src="screenshot.png" alt="Page Screenshot">
  
  <h2>HTTP Headers</h2>
  <pre>$(cat "$OUTPUT_DIR/headers.txt")</pre>
  
  <h2>HTML Content</h2>
  <pre>$(cat "$OUTPUT_DIR/content.html" | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g')</pre>
</body>
</html>
HTML

echo "HTML report created at $OUTPUT_DIR/report.html"

# 5. Open the report
echo "Opening report in browser..."
open "$OUTPUT_DIR/report.html"

echo "Debug capture complete!" 