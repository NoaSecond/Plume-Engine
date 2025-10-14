# Plume Engine 🪶

**Plume Engine 🪶 — A small, lightweight 3D game engine written in modern C++ with a multi-backend rendering architecture.**

---

## 🎯 Project Philosophy

Plume Engine is designed with **extensibility** and **portability** at its core. The rendering system uses an abstraction layer (Render Hardware Interface - RHI) that allows supporting multiple graphics APIs without rewriting game code.

### Why This Architecture?

Modern game engines like Unreal Engine, Unity, and Godot support multiple graphics APIs to maximize platform compatibility and performance. Plume Engine follows this proven pattern:

```
┌─────────────────────────────────────┐
│      Game/Engine Code               │  ← The game logic
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Rendering Abstraction Layer (RHI) │  ← Common interface
│   (Renderer, Shader, Buffer, etc.)  │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┬──────────┐
       │                │          │
┌──────▼──────┐  ┌─────▼─────┐  ┌─▼────────┐
│   OpenGL    │  │  Vulkan   │  │ DirectX  │  ← Backend implementations
│  (Current)  │  │  (Future) │  │ (Future) │
└─────────────┘  └───────────┘  └──────────┘
```

**Benefits:**
- ✅ **Write once, run anywhere**: Game code stays the same across all backends
- ✅ **Future-proof**: Easy to add new graphics APIs (Vulkan, DirectX 12, Metal, WebGPU)
- ✅ **Platform optimization**: Use the best API for each platform (Vulkan on Linux, DirectX on Xbox, Metal on macOS)
- ✅ **Incremental development**: Start with OpenGL, add others when needed

**Current Status:**
- ✅ OpenGL backend (in development)
- 🔜 Vulkan backend (planned)
- 🔜 DirectX 12 backend (planned)

---

## 🏗️ Architecture Overview

### Core Structure

```
src/
├── Core/
│   ├── Application.h/cpp       # Main engine loop and lifecycle
│   └── Window.h/cpp            # Window management (SDL2)
│
├── Renderer/
│   ├── RenderAPI.h             # Abstract graphics API interface
│   ├── Renderer.h/cpp          # High-level rendering facade
│   ├── Shader.h/cpp            # Shader abstraction
│   ├── Buffer.h/cpp            # Vertex/Index buffer abstraction
│   │
│   ├── OpenGL/                 # OpenGL implementation
│   │   ├── OpenGLRenderAPI.h/cpp
│   │   ├── OpenGLShader.h/cpp
│   │   └── OpenGLBuffer.h/cpp
│   │
│   ├── Vulkan/                 # Future: Vulkan implementation
│   └── DirectX/                # Future: DirectX implementation
│
└── main.cpp
```

### Key Concepts

**1. RenderAPI Interface**
Abstract base class defining all graphics operations. Each backend (OpenGL, Vulkan, etc.) implements this interface.

**2. Renderer**
High-level facade that uses RenderAPI. Your game code only interacts with this layer, never directly with OpenGL/Vulkan/DirectX.

**3. Backend Selection**
The engine automatically selects the appropriate backend at runtime based on platform and availability:
- Windows: DirectX 12 → Vulkan → OpenGL
- Linux: Vulkan → OpenGL
- macOS: Metal → OpenGL (deprecated on macOS)

---

## 🧰 Prerequisites

Before building, make sure you have the following installed:

### 🔹 Required
- **CMake** ≥ 3.15
  - 👉 [Download CMake](https://cmake.org/download/)
- **C++ Toolchain** with C++17 support
  - Windows → MSVC (Visual Studio 2022 or Build Tools)
  - Linux/macOS → GCC ≥ 7 or Clang ≥ 5
- **Git** → [git-scm.com](https://git-scm.com/)

### 🔹 Recommended
- **vcpkg** (C++ package manager by Microsoft)
  - 👉 [https://github.com/microsoft/vcpkg](https://github.com/microsoft/vcpkg)

### 🔹 Recommended Development Environment
- **Visual Studio Code** with extensions:
  - CMake Tools (by Microsoft) — Auto-configures IntelliSense
  - C/C++ (by Microsoft) — Code completion and debugging
  - CMake Language Support — Syntax highlighting

---

## 📦 Dependencies

Install dependencies via **vcpkg** for automatic configuration:

### Current (OpenGL Backend)
- **SDL2** — Cross-platform window and input management
- **glad** — OpenGL function loader (loads modern OpenGL functions)
- **GLM** — Mathematics library for 3D graphics (vectors, matrices, quaternions)
- **ufbx** — Lightweight FBX model loader

### Future Dependencies
When adding Vulkan or DirectX backends:
- **Vulkan SDK** — For Vulkan backend
- **DirectX 12** — Included with Windows SDK

---

## 🔨 Build Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/NoaSecond/Plume-Engine.git
cd Plume-Engine
```

### 2. Install Dependencies (vcpkg)
```bash
vcpkg install sdl2 glad glm ufbx
```

### 3. Configure and Build
```bash
# Configure (replace <path-to-vcpkg> with your vcpkg installation path)
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=<path-to-vcpkg>/scripts/buildsystems/vcpkg.cmake

# Build (Release mode)
cmake --build build --config Release
```

**Example on Windows:**
```powershell
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=C:\dev\vcpkg\scripts\buildsystems\vcpkg.cmake
cmake --build build --config Release
```

### 4. Run
```bash
# Windows
.\build\Release\PlumeEngine.exe

# Linux/macOS
./build/PlumeEngine
```

---

## 🎮 Usage

Currently, Plume Engine creates a window and sets up the rendering context. As development progresses:

- **Phase 1 (Current)**: OpenGL backend with basic rendering (triangles, cubes)
- **Phase 2**: Entity-Component System (ECS) for game objects
- **Phase 3**: Model loading, textures, lighting
- **Phase 4**: Additional backends (Vulkan, DirectX)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

- **Language**: Write all code, documentation, and commit messages in **English**
- **Commits**: Use [Gitmoji](https://gitmoji.dev/) for expressive commit messages
- **Code Style**: Follow existing conventions (see `CONTRIBUTING.md`)
- **Pull Requests**: Keep them small and focused on a single feature/fix

### Commit Examples

```bash
✨ Add OpenGL shader abstraction
🐛 Fix vertex buffer binding issue
📝 Update architecture documentation
♻️ Refactor RenderAPI interface
🎨 Improve code formatting
⚡️ Optimize rendering loop
✅ Add unit tests for buffer management
```

**Quick tip**: Install `gitmoji-cli` for interactive commits:
```bash
npm install -g gitmoji-cli
npx gitmoji-cli -c
```

See `CONTRIBUTING.md` for detailed contribution guidelines.

---

## 📚 Learning Resources

Building a game engine is a complex but rewarding journey. Here are some resources:

- **LearnOpenGL** ([learnopengl.com](https://learnopengl.com/)) — Excellent OpenGL tutorials
- **Vulkan Tutorial** ([vulkan-tutorial.com](https://vulkan-tutorial.com/)) — When ready for Vulkan
- **Game Engine Architecture** by Jason Gregory — Comprehensive book on engine design
- **The Cherno's Game Engine Series** (YouTube) — Practical engine development

---

## 📄 License

This project is licensed under the **MIT License**. See `LICENSE` for details.

---

## 🗺️ Roadmap

### ✅ Completed
- Basic window creation with SDL2
- Project structure and build system

### 🚧 In Progress
- OpenGL backend implementation
- Rendering abstraction layer (RHI)
- Basic 3D rendering (triangles, cubes)

### 🔜 Planned
- Entity-Component System (ECS)
- Model loading with ufbx
- Texture system
- Lighting (Phong, PBR)
- Camera system (FPS, orbital)
- Vulkan backend
- DirectX 12 backend
- Scene management
- Physics integration

---

**Built with ❤️ and modern C++**