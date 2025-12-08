#pragma once
#include "Scene.h"
#include <Rendering/RHI/RHITypes.h>
#include <iostream>
#include <chrono>
#include <memory>
#include <Rendering/Renderer.h>

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
        Plume::Renderer* GetRendererObject() { return m_RendererObject.get(); }
        
        // Camera control helpers
        void TranslateCamera(const Plume::Vec3& delta);
        void RotateCamera(const Plume::Vec3& delta);
        // Translate in camera-local space (x = right, y = up, z = forward)
        void TranslateCameraLocal(const Plume::Vec3& delta);
        // Performance stats
        float GetFrameTimeMs() const;
        float GetFPS() const;
    private:
        bool m_IsRunning = false;
        std::unique_ptr<Scene> m_Scene;
        std::unique_ptr<RHI::RHIDevice> m_Renderer;
        std::unique_ptr<Plume::Renderer> m_RendererObject;
        void* m_WindowHandle = nullptr;
        uint32_t m_WindowWidth = 1280;
        uint32_t m_WindowHeight = 720;
        RHI::GraphicsAPI m_CurrentAPI = RHI::GraphicsAPI::OpenGL;
        // Camera control is exposed via Scene methods
        // Performance tracking
        double m_FrameTimeMs = 0.0;
        float m_FPS = 0.0f;
        std::chrono::high_resolution_clock::time_point m_LastFrameTime;
    };
}
