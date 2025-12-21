#pragma once
#include "Scene.h"
#include <Rendering/RHI/RHITypes.h>
#include <iostream>
#include <chrono>
#include <memory>
#include <Rendering/Renderer.h>

#ifndef PLUME_API
#if defined(_WIN32)
    #ifdef PLUME_EXPORT
        #define PLUME_API __declspec(dllexport)
    #else
        #define PLUME_API __declspec(dllimport)
    #endif
#else
    #define PLUME_API
#endif
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
        Scene* GetActiveScene() { return m_ActiveScene; } // Return active (Main or Preview)
        Scene* GetMainScene() { return m_Scene.get(); } // Return Main Scene specifically
        RHI::RHIDevice* GetRenderer() { return m_Renderer.get(); }
        RHI::GraphicsAPI GetCurrentGraphicsAPI() const { return m_CurrentAPI; }
        Plume::Renderer* GetRendererObject() { return m_RendererObject.get(); }
        
        // Camera control helpers
        void TranslateCamera(const Plume::Vec3& delta);
        void RotateCamera(const Plume::Vec3& delta);
        void SetCameraMode(int mode); // 0 = Free, 1 = Orbital
        // Translate in camera-local space (x = right, y = up, z = forward)
        void TranslateCameraLocal(const Plume::Vec3& delta, bool followPitch = true);
        // Performance stats
        float GetFrameTimeMs() const;
        float GetFPS() const;
        // Performance control
        void SetMaxFPS(int max);
        int GetMaxFPS() const;
        void SetVSync(bool on);
        bool GetVSync() const;

        // Preview Pipeline
        void LoadPreviewAsset(const std::string& path);
        void PreviewMaterial(const std::string& vertexCode, const std::string& fragmentCode);
        void StopPreview();
        
        void LoadMainLevel();

    private:
        bool m_IsRunning = false;
        std::unique_ptr<Scene> m_Scene;
        std::unique_ptr<Scene> m_PreviewScene;
        Scene* m_ActiveScene = nullptr; // Points to either m_Scene or m_PreviewScene

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
        int m_MaxFPS = 60;
        bool m_VSync = true;
    };
}
