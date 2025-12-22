<img src="Assets/Branding/plume_logo.svg" alt="Plume Engine Icon" width="96" height="96" />

[![Frontend](https://github.com/NoaSecond/Plume-Engine/actions/workflows/frontend.yml/badge.svg)](https://github.com/NoaSecond/PlumeEngine-Editor/actions/workflows/frontend.yml)
[![Windows Build](https://github.com/NoaSecond/Plume-Engine/actions/workflows/engine-windows.yml/badge.svg)](https://github.com/NoaSecond/PlumeEngine-Editor/actions/workflows/engine-windows.yml)
[![Linux Build](https://github.com/NoaSecond/Plume-Engine/actions/workflows/engine-linux.yml/badge.svg)](https://github.com/NoaSecond/PlumeEngine-Editor/actions/workflows/engine-linux.yml)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Author: Noa Second](https://img.shields.io/badge/Author-Noa%20Second-blue.svg)](https://noasecond.com)

# Plume Engine

Game engine combining C++ performance with a modern React-powered editor for rapid, creative development.

### Key Features

- **High-Performance ECS**: A data-oriented Entity Component System designed for cache efficiency and massive entity scaling.
- **Multi-API RHI**: A unified Rendering Hardware Interface supporting modern graphics APIs including OpenGL, Vulkan, DirectX 12, and Metal.
- **React-Powered Tooling**: An extensible, modern editor UI leveraging the full React ecosystem and TypeScript for a premier developer experience.
- **Cross-Platform Runtime**: Native C++ execution with first-class support for Windows and Linux environments.
- **Modern Build Pipeline**: Streamlined CMake and NPM integration for a unified, predictable build process across different environments.

## Build Instructions

**Important:** You must build the Web Interface before building the C++ Engine, as the editor requires the UI files.

### 1. Build Web Interface

```bash
cd Source/Editor/Frontend
npm install
npm run build
```

This generates the final HTML file in `Bin/UI/index.html`. The build process:
1. Compiles TypeScript and React code
2. Bundles assets with Vite
3. Inlines CSS and JavaScript into a single HTML file

**Verify the build:** Check that `Bin/UI/index.html` exists before proceeding.

### 2. Build C++ Engine

```bash
cd ../../..
mkdir Build
cd Build
cmake ..
cmake --build . --config Release
```

### 3. Run

Navigate to `Bin/Release` and launch `PlumeEditor.exe`.

**Troubleshooting:**
- If you get "Cannot find UI/index.html" error, rebuild the Web Interface (step 1)
- The editor looks for `UI/index.html` relative to the executable location

## Requirements

- Node.js 18+
- CMake 3.20+
- Visual Studio 2019+ (Windows)
- WebView2 Runtime

## Created by [Noa Second](https://noasecond.com)

Built with modern C++ and React, designed to last.
