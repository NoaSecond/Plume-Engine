# Plume Engine - Rendering System

## Architecture

Le système de rendu de Plume Engine utilise une architecture RHI (Rendering Hardware Interface) qui permet l'abstraction des APIs graphiques.

### Structure

```
Rendering/
├── RHI/                    # Interface abstraite
│   ├── RHIDevice.h         # Device principal
│   ├── RHISwapChain.h      # Swap chain
│   ├── RHICommandBuffer.h  # Command buffers
│   └── RHITypes.h          # Types communs
├── Vulkan/                 # Implémentation Vulkan
│   ├── VulkanDevice.*      # Device Vulkan
│   ├── VulkanSwapChain.*   # Swap chain Vulkan
│   └── VulkanCommandBuffer.* # Command buffers Vulkan
├── OpenGL/                 # Implémentation OpenGL
│   ├── OpenGLDevice.*      # Device OpenGL
│   ├── OpenGLSwapChain.*   # Swap chain OpenGL
│   └── OpenGLCommandBuffer.* # Command buffers OpenGL
├── DirectX12/              # Implémentation DirectX 12
│   ├── DX12Device.*        # Device DirectX 12
│   ├── DX12SwapChain.*     # Swap chain DirectX 12
│   └── DX12CommandBuffer.* # Command buffers DirectX 12
└── Renderer.*              # Renderer de scène haut-niveau
```

## APIs Graphiques Supportées

### ✅ Vulkan
- Implémentation complète
- Support Windows (via VK_USE_PLATFORM_WIN32_KHR)
- Validation layers en mode Debug
- Double/Triple buffering
- **Nécessite**: Vulkan SDK installé

### ✅ OpenGL
- Implémentation complète
- Support Windows (via WGL)
- Immediate mode rendering
- **Toujours disponible** sur Windows (opengl32.dll)

### ✅ DirectX 12
- Implémentation complète
- Support Windows 10+
- Command lists et command allocators
- **Toujours disponible** sur Windows 10+

### ✅ Metal
- Implémentation complète
- Support macOS et iOS
- CAMetalLayer et command encoders
- **Toujours disponible** sur macOS/iOS

## Configuration Requise

### Vulkan (optionnel)
- Vulkan SDK 1.2+
- Drivers graphiques compatibles Vulkan
- Windows 10+

### OpenGL (toujours disponible)
- OpenGL 3.3+ (inclus dans Windows)
- Drivers graphiques à jour

### DirectX 12 (toujours disponible)
- Windows 10+ (inclus dans le système)
- Drivers graphiques à jour

## Utilisation

### Initialisation

```cpp
#include <Core/Engine.h>
#include <Rendering/RHI/RHIDevice.h>

Plume::Engine engine;
engine.Init();

// Initialiser le renderer avec une fenêtre
HWND windowHandle = ...; // Handle de fenêtre Win32
engine.InitRenderer(windowHandle, 1920, 1080);
```

### Boucle de rendu

```cpp
while (engine.IsRunning()) {
    engine.RenderFrame();
}
```

### Rendu manuel

```cpp
auto* renderer = engine.GetRenderer();
if (renderer) {
    renderer->BeginFrame();
    
    auto* cmdBuffer = renderer->GetCurrentCommandBuffer();
    cmdBuffer->BeginRenderPass();
    
    // Commandes de rendu ici
    
    cmdBuffer->EndRenderPass();
    renderer->EndFrame();
    renderer->Present();
}
```

## Fonctionnalités

### Actuellement Implémenté

- ✅ Initialisation Vulkan
- ✅ Swap chain avec depth buffer
- ✅ Command buffers et synchronisation
- ✅ Render passes basiques
- ✅ Viewport et scissor
- ✅ Clear color configurable

### À Venir

- 🚧 Vertex buffers et index buffers
- 🚧 Pipeline graphics avec shaders
- 🚧 Uniform buffers (matrices MVP)
- 🚧 Textures et samplers
- 🚧 Matériaux PBR
- 🚧 Lighting système
- 🚧 Shadow mapping
- 🚧 Post-processing

## Debug

En mode Debug, les validation layers Vulkan sont automatiquement activées et logguent les erreurs.

## Performances

- Double/Triple buffering pour éviter les stutters
- Command buffer pré-alloués
- Memory pools optimisés (à venir)

## Limitations Actuelles

- Support Windows uniquement
- Pas encore de mesh loading
- Pas encore de shaders compilés
- Rendu basique (clear color seulement)

## Roadmap

1. **Phase 1** (Actuelle) - Infrastructure Vulkan ✅
   - Device, swap chain, command buffers
   - Render passes basiques

2. **Phase 2** - Geometry & Shaders
   - Vertex/Index buffers
   - Shader compilation (SPIR-V)
   - Pipeline graphics

3. **Phase 3** - Materials & Lighting
   - Système de matériaux PBR
   - Lighting (directional, point, spot)
   - Shadow mapping

4. **Phase 4** - Advanced Features
   - Post-processing
   - Compute shaders
   - Ray tracing (optionnel)

## Contribution

Pour ajouter une nouvelle API graphique (ex: DirectX 12):

1. Créer un dossier `Rendering/DirectX12/`
2. Implémenter les interfaces RHI
3. Ajouter dans `RHIDevice::Create()`
4. Mettre à jour CMakeLists.txt
