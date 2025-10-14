# Plume Engine 🪶

<p align="center">
  <img src="assets/icons/PlumeEngineIcon_500px.png" alt="Plume Engine" />
</p>

**Plume Engine 🪶 — A modern, lightweight 3D game engine written in C++ with multi-backend rendering architecture.**

---

## 🎯 Project Philosophy

Plume Engine is designed with **extensibility**, **performance**, and **portability** at its core. The rendering system uses a Render Hardware Interface (RHI) abstraction layer that allows supporting multiple graphics APIs (OpenGL, Vulkan, DirectX) without rewriting game code.

### Why This Architecture?

Professional game engines like Unreal Engine, Unity, and Godot support multiple graphics APIs to maximize platform compatibility and performance.
Plume Engine follows this proven architectural pattern:

```
┌─────────────────────────────────────┐
│      Game/Engine Code               │  ← The game logic (API-agnostic)
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Rendering Abstraction Layer (RHI) │  ← Common interface
│   (Renderer, Shader, Buffer, etc.)  │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┬──────────┬──────────┐
       │                │          │          │
┌──────▼──────┐  ┌─────▼─────┐  ┌─▼────────┐ ┌─▼────────┐
│   OpenGL    │  │  Vulkan   │  │ DirectX  │ │  Metal   │
│  (Current)  │  │  (Future) │  │ (Future) │ │ (Future) │
└─────────────┘  └───────────┘  └──────────┘ └──────────┘
```

**Key Benefits:**
- ✅ **Write once, run anywhere**: Game code remains identical across all backends
- ✅ **Future-proof**: Easily add new graphics APIs as they emerge
- ✅ **Platform optimization**: Automatically use the best API per platform
  - Windows → DirectX 12 > Vulkan > OpenGL
  - Linux → Vulkan > OpenGL
  - macOS/iOS → Metal > Vulkan (MoltenVK)
  - Android → Vulkan > OpenGL ES
- ✅ **Incremental development**: Start with OpenGL, add others when needed
- ✅ **Performance**: Backend-specific optimizations without affecting game code

**Current Status:**
- ✅ OpenGL 4.5+ backend (in development)
- 🔜 Vulkan 1.3 backend (planned)
- 🔜 DirectX 12 backend (planned)
- 🔜 Metal backend (planned)

---

## 🏗️ Architecture Overview

### Core Structure

```
src/
├── Core/
│   ├── Application.h/cpp       # Main engine loop and lifecycle
│   ├── Window.h/cpp            # Platform-agnostic window (GLFW)
│   ├── Input.h/cpp             # Input system abstraction
│   ├── Logger.h/cpp            # Logging system (spdlog wrapper)
│   └── Timestep.h              # Frame timing and delta time
│
├── Renderer/
│   ├── RenderAPI.h             # Abstract graphics API interface
│   ├── Renderer.h/cpp          # High-level rendering facade
│   ├── RenderCommand.h/cpp     # Command queue abstraction
│   ├── Shader.h/cpp            # Shader abstraction
│   ├── Buffer.h/cpp            # Vertex/Index buffer abstraction
│   ├── Texture.h/cpp           # Texture abstraction
│   ├── VertexArray.h/cpp       # Vertex array object abstraction
│   │
│   ├── OpenGL/                 # OpenGL 4.5+ implementation
│   │   ├── OpenGLContext.h/cpp
│   │   ├── OpenGLRenderAPI.h/cpp
│   │   ├── OpenGLShader.h/cpp
│   │   ├── OpenGLBuffer.h/cpp
│   │   └── OpenGLTexture.h/cpp
│   │
│   ├── Vulkan/                 # Future: Vulkan implementation
│   ├── DirectX/                # Future: DirectX 12 implementation
│   └── Metal/                  # Future: Metal implementation
│
├── Scene/
│   ├── Entity.h/cpp            # Entity wrapper (EnTT)
│   ├── Scene.h/cpp             # Scene management
│   ├── Components.h            # Common components
│   └── SceneSerializer.h/cpp   # Scene save/load
│
├── Resources/
│   ├── Model.h/cpp             # 3D model representation
│   ├── ModelLoader.h/cpp       # Assimp wrapper
│   ├── TextureLoader.h/cpp     # stb_image wrapper
│   └── ResourceManager.h/cpp   # Asset caching and management
│
└── main.cpp
```

### Design Patterns Used

- **Strategy Pattern**: RenderAPI interface with multiple implementations
- **Facade Pattern**: Renderer provides simplified interface to complex rendering
- **Factory Pattern**: Backend creation based on platform/availability
- **Entity-Component System**: EnTT for flexible game object composition
- **Resource Management**: Reference counting and caching for assets

---

## 🧰 Prerequisites

### 🔹 Required
- **CMake** ≥ 3.15 — [Download](https://cmake.org/download/)
- **C++17 Compiler**:
  - Windows: MSVC 2019+ (Visual Studio 2022 recommended)
  - Linux: GCC 9+ or Clang 10+
  - macOS: Xcode 12+ (Clang)
- **Git** — [git-scm.com](https://git-scm.com/)
- **vcpkg** — [Microsoft's C++ Package Manager](https://github.com/microsoft/vcpkg)

### 🔹 Optional but Recommended
- **Vulkan SDK** — For Vulkan backend development
- **Visual Studio Code** with extensions:
  - CMake Tools
  - C/C++ Extension Pack
  - Shader languages support (GLSL, HLSL)

---

## 📦 Dependencies

All dependencies are managed via **vcpkg** for seamless cross-platform builds.

### Core Dependencies (All Platforms)

```bash
vcpkg install glfw3 glad glm assimp spdlog stb entt
```

| Library | Purpose | Why This Choice |
|---------|---------|----------------|
| **GLFW** | Windowing, input, OpenGL/Vulkan context | Modern, lightweight, multi-API support |
| **GLAD** | OpenGL function loader | Industry standard, easy to configure |
| **GLM** | Math library (vectors, matrices) | OpenGL-compatible, header-only |
| **Assimp** | 3D model loading (FBX, OBJ, GLTF, etc.) | Supports 40+ formats, well-maintained |
| **spdlog** | Fast logging library | High-performance, thread-safe, colored output |
| **stb** | Image loading (PNG, JPG, TGA, etc.) | Single-header, no dependencies |
| **EnTT** | Entity Component System | Ultra-fast, modern C++, cache-friendly |

### Optional Dependencies

```bash
vcpkg install imgui[glfw-binding,opengl3-binding]  # Debug UI
vcpkg install yaml-cpp  # Scene serialization
```

### Platform-Specific (Future)

- **Windows**: DirectX 12 (included with Windows SDK 10+)
- **All platforms**: Vulkan SDK for Vulkan backend

---

## 🔨 Build Instructions

### 1️⃣ Setup vcpkg

```bash
# Clone vcpkg
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg

# Bootstrap vcpkg
./bootstrap-vcpkg.sh  # Linux/macOS
.\bootstrap-vcpkg.bat  # Windows

# Add to PATH or remember the path for later
```

### 2️⃣ Clone Plume Engine

```bash
git clone https://github.com/NoaSecond/Plume-Engine.git
cd Plume-Engine
```

### 3️⃣ Install Dependencies

```bash
# Core dependencies (required)
vcpkg install glfw3 glad glm assimp spdlog stb entt

# Optional: Debug UI
vcpkg install imgui[glfw-binding,opengl3-binding]
```

### 4️⃣ Configure & Build

```bash
# Configure with vcpkg toolchain
cmake -B build -S . \
  -DCMAKE_TOOLCHAIN_FILE=[path-to-vcpkg]/scripts/buildsystems/vcpkg.cmake \
  -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build build --config Release

# Run
./build/PlumeEngine  # Linux/macOS
.\build\Release\PlumeEngine.exe  # Windows
```

**Windows Example:**
```powershell
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=C:\dev\vcpkg\scripts\buildsystems\vcpkg.cmake
cmake --build build --config Release
```

### 5️⃣ Development Build (Debug)

```bash
cmake -B build-debug -S . \
  -DCMAKE_TOOLCHAIN_FILE=[vcpkg-path]/scripts/buildsystems/vcpkg.cmake \
  -DCMAKE_BUILD_TYPE=Debug

cmake --build build-debug --config Debug
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Language
- All code, comments, documentation, and commits **must be in English**

### Code Style
- **C++17** standard (may upgrade to C++20 later)
- **4 spaces** for indentation (no tabs)
- **PascalCase** for classes/structs: `RenderAPI`, `OpenGLShader`
- **camelCase** for functions/variables: `drawTriangle()`, `vertexBuffer`
- **UPPER_SNAKE_CASE** for constants: `MAX_TEXTURE_SLOTS`
- Use `const` and `constexpr` whenever possible
- Prefer smart pointers (`std::unique_ptr`, `std::shared_ptr`) over raw pointers

### Commit Messages

Use **Gitmoji** for expressive, visual commits:

```bash
✨ Add Vulkan backend initialization
🐛 Fix OpenGL buffer binding issue
📝 Update architecture documentation  
♻️ Refactor shader compilation pipeline
🎨 Improve code formatting in RenderAPI
⚡️ Optimize vertex buffer uploads
✅ Add unit tests for ECS
🔥 Remove deprecated SDL2 code
🚀 Improve rendering performance by 40%
🔧 Update CMake configuration
```

**Install gitmoji-cli** (optional):
```bash
npm install -g gitmoji-cli
npx gitmoji-cli -c  # Interactive commit
```

### Pull Request Process

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit** your changes with Gitmoji
4. **Push** to your fork: `git push origin feature/amazing-feature`
5. Open a **Pull Request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/videos if UI changes

See `CONTRIBUTING.md` for detailed guidelines.

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Current)
- [x] Project structure and build system
- [x] Window creation (GLFW)
- [ ] OpenGL context and rendering
- [ ] Basic 3D rendering (cubes, lighting)
- [ ] Shader system
- [ ] Camera system (FPS, orbital)

### 🚧 Phase 2: Core Features (In Progress)
- [ ] Entity Component System (EnTT)
- [ ] Model loading (Assimp)
- [ ] Texture system (stb_image)
- [ ] Material system
- [ ] Scene graph
- [ ] Input abstraction

### 🔜 Phase 3: Advanced Rendering
- [ ] PBR (Physically Based Rendering)
- [ ] Shadow mapping
- [ ] Deferred rendering
- [ ] Post-processing effects
- [ ] Skybox and environment mapping

### 🔮 Phase 4: Multi-Backend
- [ ] Vulkan backend
- [ ] DirectX 12 backend
- [ ] Metal backend (macOS/iOS)
- [ ] Runtime backend switching

### 🎯 Phase 5: Engine Features
- [ ] Physics integration (PhysX or Bullet)
- [ ] Audio system (OpenAL or FMOD)
- [ ] Scripting (Lua or C#)
- [ ] Editor (ImGui-based)
- [ ] Serialization and scene saving

---

## 🎨 Example Projects

Once stable, Plume Engine will be showcased with example projects:
- 🎮 **Simple FPS Demo** — Basic gameplay mechanics
- 🎮 **TPS Demo** — Third-person shooter controls and camera
- 🛠️ **Blank Project Template** — Minimal starter for new games

---

## 📊 Performance Goals

Target performance on mid-range hardware (GTX 1060 / RX 580):
- **10,000+** draw calls per frame at 60 FPS
- **1M+** triangles rendered per frame
- **Sub-1ms** frame time for core engine systems
- **< 100 MB** RAM for base engine (excluding game assets)

---

## 📄 License

**MIT License** — See `LICENSE` file for details.

You are free to use Plume Engine in commercial and non-commercial projects.

---

## 💬 Community & Support

- **Issues**: [GitHub Issues](https://github.com/NoaSecond/Plume-Engine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/NoaSecond/Plume-Engine/discussions)
- **Wiki**: [Engine Documentation](https://github.com/NoaSecond/Plume-Engine/wiki) (coming soon)

---

## 🙏 Acknowledgments

Plume Engine is inspired by and learns from:
- **Godot Engine** — Open-source architecture
- **Unreal Engine** — Multi-backend design patterns

Special thanks to the open-source community for creating amazing libraries like GLFW, Assimp, EnTT, and spdlog.

---

**Built with ❤️ using modern C++ and best practices**

*"A feather-light engine with heavyweight capabilities"* 🪶