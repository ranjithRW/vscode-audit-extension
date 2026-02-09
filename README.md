# React Flow Auditor - VS Code Extension

This extension automatically analyzes React projects for bugs, flow issues, performance problems, and security risks.

## Features

- **Project Understanding**: Identifies tech stack and potential flows.
- **Bug Detection**: Scans for common React bugs (hooks usage, console logs, etc.).
- **Security Scanning**: Checks for hardcoded secrets, `eval()`, and insecure protocols.
- **Flow Analysis**: Maps out React Router paths and API calls.

## How to Run

1. Open this folder in VS Code.
2. Run `npm install` to install dependencies.
3. Press `F5` to open a new VS Code window with the extension loaded.
4. In the new window, open a React project.
5. Run the command `Audit React Project` from the Command Palette (`Ctrl+Shift+P`).

## Output

The extension will generate a strict JSON report and display it in a new editor tab.

## Structure

- `src/extension.ts`: Entry point.
- `src/auditor`: Main logic.
- `src/analyzers`: Specific analysis rules.
