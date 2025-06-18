# Chrome DevTools Debugging Guide

This guide explains how to use the Chrome DevTools to debug a website using the Chrome DevTools Protocol (CDP).

## Getting Started

1. Run the debugger script with a URL:

   ```
   ./chrome-debugger.sh https://example.com
   ```

2. Chrome will open with DevTools automatically activated.

## Using the Debugger

### Setting Breakpoints

1. **Navigate to the Sources panel**:

   - Click on the "Sources" tab in the DevTools window

2. **Locate JavaScript files**:

   - Expand the file tree in the left sidebar
   - Look for JavaScript files under the domain you're debugging
   - You may need to reload the page to see all files

3. **Set breakpoints**:
   - Click on a line number to create a breakpoint
   - Right-click on a breakpoint for additional options:
     - Conditional breakpoints (only break when a condition is true)
     - Logpoints (log messages without stopping execution)

### When Execution Pauses

When the code reaches a breakpoint, execution will pause and you can:

1. **Examine variables**:

   - Hover over variables to see their values
   - Use the Scope panel (right side) to see all variables in scope
   - Type expressions in the Console to evaluate in the current context

2. **Navigate the call stack**:

   - The Call Stack panel shows how you arrived at this point
   - Click on different stack frames to see different execution contexts

3. **Step through code**:
   - Resume (F8 or ▶️): Continue execution until next breakpoint
   - Step Over (F10 or ⤵️): Execute current line and move to next line
   - Step Into (F11 or ↘️): Enter a function call
   - Step Out (Shift+F11 or ↗️): Exit current function

### Debugging DOM and Network

1. **DOM manipulation**:

   - Use the Elements panel to inspect and modify the DOM
   - Changes are reflected immediately on the page

2. **Network requests**:
   - Switch to the Network panel to monitor all requests
   - Filter by type (XHR, JS, CSS, etc.)
   - See timing, headers, and response data

### Console Debugging

The Console panel can be used while debugging to:

1. **Evaluate expressions**:

   - Type JavaScript to evaluate in the current context
   - Access variables that are in scope at the breakpoint

2. **Log data**:
   - Add `console.log()`, `console.error()`, etc. to your code
   - See output in the Console panel

### Taking Screenshots

To capture evidence of debugging:

1. Use Cmd+Shift+4 (Mac) or Win+Shift+S (Windows) to take screenshots of:

   - The paused code with variables
   - The call stack
   - Console output

2. Save screenshots to the session directory for documentation

## Debugging React Applications

For React applications, install the React DevTools extension for additional debugging capabilities:

1. **Component tree**:

   - Inspect React components hierarchy
   - See props and state

2. **Component profiling**:
   - Measure render performance
   - Identify unnecessary re-renders

## Finishing Up

1. When done debugging, close Chrome or press Ctrl+C in the terminal
2. Check the output directory for saved information
3. Document any findings for future reference

## Advanced Techniques

### Blackboxing Scripts

To ignore certain scripts (like libraries) during debugging:

1. Right-click a script in Sources
2. Select "Blackbox script"

### Workspace

For a seamless edit-debug workflow:

1. In Sources, right-click the left panel
2. Select "Add folder to workspace"
3. Map network resources to local files

### Snippets

For reusable debugging code:

1. Go to Sources > Snippets
2. Create JavaScript snippets to run on any page
