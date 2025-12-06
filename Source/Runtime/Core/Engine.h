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
        void InitRenderer(void* windowHandle, uint32_t width, uint32_t height, RHI::GraphicsAPI api = RHI::GraphicsAPI::OpenGL);
        void ReInitRenderer(RHI::GraphicsAPI api = RHI::GraphicsAPI::OpenGL);
        void Run();
        void RenderFrame();
        void Shutdown();
        bool IsRunning() const { return m_IsRunning; }
        Scene* GetActiveScene() { return m_Scene.get(); }
        RHI::RHIDevice* GetRenderer() { return m_Renderer.get(); }
        RHI::GraphicsAPI GetCurrentGraphicsAPI() const { return m_CurrentAPI; }
    private:
        bool m_IsRunning = false;
        std::unique_ptr<Scene> m_Scene;
        std::unique_ptr<RHI::RHIDevice> m_Renderer;
        void* m_WindowHandle = nullptr;
        uint32_t m_WindowWidth = 1280;
        uint32_t m_WindowHeight = 720;
        RHI::GraphicsAPI m_CurrentAPI = RHI::GraphicsAPI::OpenGL;
    };
}
