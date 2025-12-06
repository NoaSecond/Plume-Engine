#pragma once
#include "Scene.h"
#include <Rendering/RHI/RHITypes.h>
#include <iostream>
#include <memory>

#if defined(_WIN32)
    #define PLUME_API __declspec(dllexport)
#else
    #define PLUME_API
#endif

namespace Plume {
namespace RHI {
    class RHIDevice;
}

    class PLUME_API Engine {
    public:
        Engine();
        ~Engine();
        void Init();
        void InitRenderer(void* windowHandle, uint32_t width, uint32_t height, RHI::GraphicsAPI api = RHI::GraphicsAPI::DirectX12);
        void Run();
        void RenderFrame();
        void Shutdown();
        bool IsRunning() const { return m_IsRunning; }
        Scene* GetActiveScene() { return m_Scene.get(); }
        RHI::RHIDevice* GetRenderer() { return m_Renderer.get(); }
    private:
        bool m_IsRunning = false;
        std::unique_ptr<Scene> m_Scene;
        std::unique_ptr<RHI::RHIDevice> m_Renderer;
    };
}
