# Changelog - Plume Engine

## [Unreleased]

### Added - Vulkan Rendering System (2025-12-06)

#### 🎨 Rendering Hardware Interface (RHI)
- Created complete RHI abstraction layer for multi-API support
- Abstract interfaces: `RHIDevice`, `RHISwapChain`, `RHICommandBuffer`
- Common types: `Viewport`, `Scissor`, `GraphicsAPI` enum
- Factory pattern for device creation supporting multiple backends

#### 🌋 Vulkan Implementation
- **VulkanDevice**: Complete Vulkan initialization
  - Instance creation with validation layers (Debug mode)
  - Physical device selection (prefers discrete GPU)
  - Logical device creation with queue families
  - Win32 surface integration
  - Debug messenger for validation errors
  
- **VulkanSwapChain**: Image presentation management
  - Automatic format selection (B8G8R8A8_SRGB preferred)
  - Depth buffer creation (D32_SFLOAT)
  - Render pass configuration (color + depth)
  - Framebuffer creation for each swapchain image
  - Dynamic resize support
  
- **VulkanCommandBuffer**: Command recording
  - Command pool management
  - Command buffer pre-allocation
  - Render pass begin/end
  - Viewport and scissor configuration
  - Draw commands (indexed and non-indexed)

#### 🔧 Engine Integration
- Added `Engine::InitRenderer(hwnd, width, height)` for renderer initialization
- Added `Engine::RenderFrame()` for per-frame rendering
- Integrated renderer into main engine loop
- Added `Renderer` class for high-level scene rendering

#### 🛠️ Build System
- CMake configuration for Vulkan SDK detection
- Conditional compilation with `PLUME_VULKAN_ENABLED`
- Compiles successfully with or without Vulkan SDK
- Clear warnings when Vulkan is not available

#### 📚 Documentation
- `VULKAN_SETUP.md`: Complete installation and setup guide
- `VULKAN_INTEGRATION.md`: Technical summary of the implementation
- `Source/Runtime/Rendering/README.md`: Architecture documentation
- Updated main `README.md` with Vulkan status

#### ⚙️ Features
- Double buffering (2 frames in flight)
- CPU-GPU synchronization with semaphores and fences
- Validation layers in Debug mode
- Clear color rendering (foundation for geometry)
- Windows platform support (Win32 surface)

### Technical Details

**Files Added:**
```
Source/Runtime/Rendering/
├── RHI/
│   ├── RHIDevice.h/.cpp
│   ├── RHISwapChain.h
│   ├── RHICommandBuffer.h
│   └── RHITypes.h
├── Vulkan/
│   ├── VulkanDevice.h/.cpp
│   ├── VulkanSwapChain.h/.cpp
│   └── VulkanCommandBuffer.h/.cpp
└── Renderer.h/.cpp
```

**Files Modified:**
- `Source/Runtime/Core/Engine.h/.cpp` - Renderer integration
- `Source/Runtime/CMakeLists.txt` - Vulkan SDK linking
- `README.md` - Updated roadmap

**Lines of Code:**
- ~1200 lines of new C++ code
- ~150 lines of CMake configuration
- ~400 lines of documentation

### Coming Next
- 🚧 Vertex buffers and index buffers
- 🚧 Shader compilation (GLSL → SPIR-V)
- 🚧 Graphics pipeline creation
- 🚧 Mesh rendering (cubes, models)
- 🚧 Camera system with MVP matrices
- 🚧 Material system (PBR)

---

## [0.1.0-alpha] - 2025-12-05

### Added
- Initial project structure
- React-based editor UI
- WebView2 integration
- Theme system (3 official themes)
- Console panel with filtering
- Plugin system (Discord Rich Presence)
- Splash screen
- Branding assets (SVG logos)

### Infrastructure
- CMake build system
- TypeScript + Vite frontend
- C++ Runtime engine
- Windows support
