# Plume Engine

A lightweight game engine with C++ backend and React frontend.

## Features

### Editor
- **Modern UI**: Professional interface with 3 built-in themes
  - Plume Dark (AAA-inspired default)
  - Nebula Midnight (Cyberpunk/Sci-fi)
  - Feather Light (Bright minimalist)
- **Hot-Reload**: Instant theme switching without page reload
- **Viewport**: Real-time 3D scene visualization
- **Hierarchy**: Scene graph with entity management
- **Details Panel**: Entity properties inspector
- **Content Browser**: Asset management (Ctrl+Space)
- **Console**: Debug logs and runtime commands

### Engine
- **C++ Runtime**: High-performance core
- **Scene Management**: Entity-component system
- **Hot-Reload UI**: Development-friendly workflow

### Rendering Architecture Update
- **Composition Hardware (Overlay) (Recommended)**: The project now uses a hardware composition overlay approach for UI integration. 3D rendering happens in a native window (HWND) using the engine's RHI backends while the modern HTML UI is displayed by a WebView2 control placed above the renderer with transparent background. This abandons previous attempts at sharing GPU textures between processes or subsystems (shared textures/shared handles). See `VULKAN_INTEGRATION.md` for details.

## Project Structure

```
PlumeEngine/
├── Assets/
│   ├── Branding/          # Logos, splash screens (SVG)
│   └── Icons/             # Application icons
├── Bin/                   # Build outputs
├── Build/                 # CMake build directory
├── Source/
│   ├── Editor/            # Editor application
│   │   ├── Frontend/      # React UI
│   │   └── EditorMain.cpp
│   ├── Launcher/          # Launcher application
│   └── Runtime/           # Engine core
└── THEMES.md              # Theme system documentation

```

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

## Themes

Plume Engine features a comprehensive theme system with 3 official themes designed for different workflows. See [THEMES.md](THEMES.md) for complete documentation.

## Roadmap

Following the project specifications:

- [x] Theme system (3 official themes with Hot-Reload)
- [x] Branding assets (SVG logos and splash screen)
- [x] Console panel with filtering
- [x] Rendering system (RHI abstraction)
- [x] Vulkan backend (optional, with SDK)
- [x] OpenGL backend (always available)
- [x] DirectX 12 backend (Windows 10+)
- [x] Metal backend (macOS/iOS)
- [ ] Vertex buffers and mesh rendering
- [ ] Shader system (SPIR-V, GLSL, HLSL)
- [ ] Splash screen integration in C++
- [ ] Complete layout panels
- [ ] Launcher application
- [ ] Input system
- [ ] Physics integration (PhysX)

## Created by Noa Second

Built with modern C++ and React, designed to last.