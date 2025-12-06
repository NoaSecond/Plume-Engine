# Switching Graphics APIs

## Available Backends

Plume Engine supports 4 graphics APIs:

1. **OpenGL** - Always available on Windows
2. **DirectX 12** - Always available on Windows 10+
3. **Vulkan** - Requires Vulkan SDK installation
4. **Metal** - Always available on macOS/iOS

## How to Select an API

Edit `Engine::InitRenderer()` call to specify the API:

```cpp
// In your code (e.g., EditorMain.cpp or game code)
#include <Core/Engine.h>
#include <Rendering/RHI/RHITypes.h>

Plume::Engine engine;
engine.Init();

// Choose your API:
engine.InitRenderer(windowHandle, 1920, 1080, Plume::RHI::GraphicsAPI::OpenGL);
// or
engine.InitRenderer(windowHandle, 1920, 1080, Plume::RHI::GraphicsAPI::DirectX12);
// or
engine.InitRenderer(windowHandle, 1920, 1080, Plume::RHI::GraphicsAPI::Vulkan);
// or
engine.InitRenderer(windowHandle, 1920, 1080, Plume::RHI::GraphicsAPI::Metal);
```

## Default Selection

- **Windows**: DirectX 12
- **macOS/iOS**: Metal
- **Linux**: Vulkan or OpenGL

## Performance Comparison

- **Vulkan**: Best performance, lowest CPU overhead, modern features
- **DirectX 12**: Excellent performance on Windows, native to the platform
- **Metal**: Excellent performance on Apple platforms, optimized for Apple Silicon
- **OpenGL**: Good compatibility, simpler API, slightly higher CPU overhead

## Recommendations

- **Development**: Use OpenGL for quick iteration
- **Production (Windows)**: Use DirectX 12 or Vulkan
- **Production (macOS/iOS)**: Use Metal
- **Cross-platform**: Use Vulkan
- **Maximum compatibility**: Use OpenGL
