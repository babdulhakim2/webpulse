#!/bin/bash

# Change to the script directory
cd "$(dirname "$0")"

# Check if node modules are installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Create screenshots directory if it doesn't exist
mkdir -p screenshots

# Set executable permissions
chmod +x index.js
chmod +x debug-browser.js

# Set port (default: 3000)
export PORT=${1:-3000}

# Start the server
echo "Starting Local Browser Debugger server on port $PORT..."
node index.js 