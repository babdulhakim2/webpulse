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
