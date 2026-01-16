# Pesteczka OS - Modular Business System

Pesteczka OS is a lightweight, modular operating system environment built for the web, designed to run a suite of business-oriented applications. Its core philosophy is a plugin-based architecture, allowing for easy expansion and maintenance.

**Created by Paweł Steczka ([pesteczka.com](https://pesteczka.com))**

![Pesteczka OS Screenshot](https://i.imgur.com/qRSzDBc.png)

## Core Philosophy

The system is designed like a microkernel operating system. The core is minimal and agnostic to the applications it runs. Its only responsibilities are:

1.  **Plugin Engine:** Dynamically discover and load applications (plugins).
2.  **UI Shell:** Manage the main desktop, windows, and taskbar.
3.  **Core Services:** Provide shared services like storage and notifications.

Everything else, from the Offer Generator to the Settings panel, is an independent plugin.

## Project Structure

The project is organized into a clean, modular structure:

```
/
├── src/
│   ├── apps/
│   │   └── settings/         # Example of a self-contained plugin
│   │       ├── manifest.json
│   │       ├── main.js
│   │       └── ui.html
│   ├── assets/               # All static assets
│   │   ├── style.css
│   │   ├── logos/
│   │   └── vendor/
│   └── core/                 # The OS microkernel
│       ├── app.js
│       ├── pluginLoader.js
│       ├── storage.js
│       └── ui.js
├── index.html                # The main application shell
└── run.py                    # Simple Python server for development
```

## Creating a New Application (Plugin)

Creating a new application is simple:

1.  **Create a New Directory:** Add a new folder inside `src/apps/`. The folder name will be your app's ID (e.g., `src/apps/my-new-app`).

2.  **Create a `manifest.json`:** This file describes your application to the OS.

    ```json
    {
      "id": "my-new-app",
      "name": "My New App",
      "description": "A brief description of what this app does.",
      "icon": "🚀",
      "entrypoints": {
        "html": "ui.html",
        "js": "main.js"
      }
    }
    ```

3.  **Create the UI (`ui.html`):** This file contains *only the HTML content* that goes inside the `.window-content` div. The window frame itself is handled by the OS.

4.  **Create the Logic (`main.js`):** This file contains your app's JavaScript. It must expose an `init` function on a global object that matches the app's name (PascalCase + "App").

    ```javascript
    // src/apps/my-new-app/main.js

    function setupMyAppListeners() {
        // Your event listener code here...
    }

    function init() {
        console.log("My New App Initialized!");
        setupMyAppListeners();
    }

    // Expose the init function
    window.MyNewAppApp = {
      init: init
    };
    ```

5.  **Add to `pluginLoader.js`:** For now, you must manually add the path to your new manifest in `src/core/pluginLoader.js` for it to be discovered.

## Development

1.  **Prerequisites:** Python 3.x is required to run the local development server.
2.  **Run the Server:**
    ```bash
    python3 run.py
    ```
3.  **Open in Browser:** Navigate to `http://localhost:8080`.

## Building a Standalone Executable (.exe)

*This section will be completed once the necessary build tools (like Electron) are integrated into the project.*

---
*This document will be updated as the project evolves.*
