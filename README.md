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

### 1. Build Web Interface

```bash
cd Source/Editor/Frontend
npm install
npm run build
```

This generates the final HTML file in `Bin/UI`.

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
- [ ] Splash screen integration in C++
- [ ] Complete layout panels
- [ ] Vulkan rendering (RHI abstraction)
- [ ] Launcher application
- [ ] Input system
- [ ] Physics integration (PhysX)

## Created by Noa Second

Built with modern C++ and React, designed to last.
