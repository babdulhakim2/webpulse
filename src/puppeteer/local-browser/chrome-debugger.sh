#!/bin/bash

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Please provide a URL to debug."
  echo "Usage: ./chrome-debugger.sh https://example.com"
  exit 1
fi

URL="$1"
TIMESTAMP=$(date +%s)
OUTPUT_DIR="./debugger-output-$TIMESTAMP"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "==============================================="
echo "  Chrome DevTools Debugging Tool"
echo "==============================================="
echo "URL: $URL"
echo "Output directory: $OUTPUT_DIR"
echo

# Find Chrome or Chromium location
if [ -d "/Applications/Google Chrome.app" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ -d "/Applications/Chromium.app" ]; then
  CHROME="/Applications/Chromium.app/Contents/MacOS/Chromium"
else
  echo "Error: Chrome or Chromium not found."
  exit 1
fi

# Create a README file with instructions
cat > "$OUTPUT_DIR/README.txt" << TEXT
Chrome DevTools Debugging Instructions
=====================================

1. Use the DevTools to add breakpoints:
   - Open the Sources panel
   - Navigate to the JavaScript file you want to debug
   - Click on the line number to add a breakpoint
   - Breakpoints will show as blue markers

2. When execution reaches a breakpoint:
   - The code execution will pause
   - Take a screenshot with Cmd+Shift+4 (Mac) or Win+Shift+S (Windows)
   - Save the screenshot to this directory
   - Examine the call stack in the right panel
   - Use the console to evaluate expressions in the current context

3. Step through code with the controls:
   - Resume (F8): Continue execution until next breakpoint
   - Step Over (F10): Execute current line and move to next line
   - Step Into (F11): Enter a function call
   - Step Out (Shift+F11): Exit current function

4. Use console to debug:
   - Type expressions in the console to inspect variables
   - Use console.log() statements in your code for ongoing monitoring

5. Inspect network activity:
   - Switch to the Network panel to see all requests
   - Filter by type (XHR, JS, CSS, etc.)
   - Check for errors or unexpected behavior

6. When finished:
   - Close the Chrome window
   - Your debugging session will be complete
TEXT

echo "Created README.txt with debugging instructions"

# Launch Chrome with DevTools open and focused on the debugger
echo "Launching Chrome with DevTools and debugger focused..."
"$CHROME" --auto-open-devtools-for-tabs "$URL" --user-data-dir="$OUTPUT_DIR/chrome-profile" &
CHROME_PID=$!

echo
echo "Chrome has been opened with DevTools ready for debugging."
echo "To set breakpoints:"
echo "1. Click on the Sources tab"
echo "2. Find the JavaScript files in the left panel"
echo "3. Click on line numbers to add breakpoints"
echo
echo "After setting breakpoints, interact with the page to trigger them."
echo "When execution pauses at a breakpoint, you can inspect variables and the call stack."
echo
echo "Press Ctrl+C to close Chrome and finish debugging."

# Wait for user to press Ctrl+C
trap "kill $CHROME_PID 2>/dev/null; echo; echo 'Debugging session ended. Chrome has been closed.'; echo 'Check $OUTPUT_DIR for any saved information.'; exit 0" INT
wait $CHROME_PID 