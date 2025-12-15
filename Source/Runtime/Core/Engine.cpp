#include "Engine.h"
#include <Rendering/RHI/RHIDevice.h>
#include <Rendering/RHI/RHISwapChain.h>
#include <Rendering/RHI/RHICommandBuffer.h>
#include <thread>
#include <chrono>
#include <cmath>
#include <fstream>
#include <sstream>
#if defined(_WIN32)
#include <filesystem>
#endif
#include <Rendering/Renderer.h>

namespace Plume {
    Engine::Engine() {}
    Engine::~Engine() { Shutdown(); }

    void Engine::Init() {
        m_Scene = std::make_unique<Scene>();
        LoadMainLevel();
        
        m_ActiveScene = m_Scene.get();
        m_IsRunning = true;
    }

    void Engine::LoadMainLevel() {
        // Ensure Content directory exists
        namespace fs = std::filesystem;
        std::string assetPath = "Content/L_Main.plumeasset";
        
        if (!fs::exists("Content")) {
            fs::create_directory("Content");
        }

        if (fs::exists(assetPath)) {
            // Load existing
            std::ifstream file(assetPath);
            std::stringstream buffer;
            buffer << file.rdbuf();
            m_Scene->DeserializeFromJson(buffer.str());
        } else {
            // Create default in-memory scene (EmptyLevel state)
            m_Scene->CreateEntity("Scene_Root", EntityType::Folder);
            m_Scene->CreateEntity("Sun_Light", EntityType::Light, "Directional");
            m_Scene->CreateEntity("Main_Camera", EntityType::Camera);
            m_Scene->CreateEntity("Rotating_Cube_CPP", EntityType::Mesh, "Cube");
            
            // DO NOT save to file automatically.
            // This is now an transient "EmptyLevel".
        }
    }

    void Engine::InitRenderer(void* windowHandle, uint32_t width, uint32_t height, RHI::GraphicsAPI api) {
        // Store window info for potential reinitialization
        m_WindowHandle = windowHandle;
        m_WindowWidth = width;
        m_WindowHeight = height;
        m_CurrentAPI = api;
        
        // Créer le device avec l'API spécifiée
        m_Renderer = RHI::RHIDevice::Create(api);
        if (m_Renderer) {
            if (!m_Renderer->Initialize(windowHandle, width, height)) {
                m_Renderer.reset();
            }
            else {
                // Create the higher-level renderer that will draw the scene
                m_RendererObject = std::make_unique<Plume::Renderer>(m_Renderer.get());
            }
        }

        // Diagnostics suppressed (retain only INI-loading diagnostics)

        // Note: WebView2 overlay is owned/created by the Editor application
        // to avoid multiple WebView2 controllers when running the Editor. The
        // Engine will render into the provided HWND passed to InitRenderer.
    }

    void Engine::ReInitRenderer(RHI::GraphicsAPI api) {
        if (!m_WindowHandle) return;
        
        m_CurrentAPI = api;
        
        // Shutdown the current renderer if it exists
        if (m_Renderer) {
            m_Renderer->Shutdown();
            m_Renderer.reset();
        }
        
        // Re-initialize with the new API using stored window info
        m_Renderer = RHI::RHIDevice::Create(api);
        if (m_Renderer) {
            if (!m_Renderer->Initialize(m_WindowHandle, m_WindowWidth, m_WindowHeight)) {
                m_Renderer.reset();
            }
        }

    // No editor-owned overlay handling here; Editor manages WebView2.
    }

    void Engine::Run() {
        auto lastTime = std::chrono::high_resolution_clock::now();
        while (m_IsRunning) {
            auto frameStart = std::chrono::high_resolution_clock::now();
            float deltaTime = std::chrono::duration<float>(frameStart - lastTime).count();
            lastTime = frameStart;
            
            // Update active scene
            if (m_ActiveScene) m_ActiveScene->OnUpdate(deltaTime);
            
            RenderFrame();

            // Frame limiting: if VSync is enabled, rely on Present to block; otherwise
            // sleep to enforce m_MaxFPS if set (>0). We compute elapsed work time and
            // sleep the remaining time to reach target frame duration.
            if (!m_VSync && m_MaxFPS > 0) {
                double targetMs = 1000.0 / static_cast<double>(m_MaxFPS);
                auto frameEnd = std::chrono::high_resolution_clock::now();
                double workMs = std::chrono::duration<double, std::milli>(frameEnd - frameStart).count();
                double sleepMs = targetMs - workMs;
                if (sleepMs > 0.5) {
                    std::this_thread::sleep_for(std::chrono::milliseconds(static_cast<int>(sleepMs)));
                }
            } else {
                // Small yield to avoid a tight loop when uncapped or relying on Present
                std::this_thread::sleep_for(std::chrono::milliseconds(1));
            }
        }
    }
    
    void Engine::RenderFrame() {
        if (!m_Renderer) return;

        // Update frame timing (FPS / ms)
        auto now = std::chrono::high_resolution_clock::now();
        if (m_LastFrameTime.time_since_epoch().count() == 0) {
            m_LastFrameTime = now;
        }
        double deltaMs = std::chrono::duration<double, std::milli>(now - m_LastFrameTime).count();
        m_FrameTimeMs = deltaMs;
        m_FPS = (deltaMs > 0.0) ? static_cast<float>(1000.0 / deltaMs) : 0.0f;
        m_LastFrameTime = now;

        m_Renderer->BeginFrame();

        auto* cmdBuffer = m_Renderer->GetCurrentCommandBuffer();
        if (cmdBuffer) {
            // Configure viewport et scissor for the full swapchain/backbuffer before beginning the render pass
            auto* swapChain = m_Renderer->GetSwapChain();
            RHI::Viewport viewport;
            viewport.width = static_cast<float>(swapChain->GetWidth());
            viewport.height = static_cast<float>(swapChain->GetHeight());
            cmdBuffer->SetViewport(viewport);

            RHI::Scissor scissor;
            scissor.width = swapChain->GetWidth();
            scissor.height = swapChain->GetHeight();
            cmdBuffer->SetScissor(scissor);

            // Now begin the render pass (clear will respect scissor if enabled)
            cmdBuffer->BeginRenderPass();

            // Delegate to the high-level Renderer which knows how to draw the scene
            if (m_RendererObject && m_ActiveScene) {
                m_RendererObject->RenderScene(m_ActiveScene);
            }

            cmdBuffer->EndRenderPass();
        }
        
        m_Renderer->EndFrame();
        m_Renderer->Present();

        // Heartbeat diagnostics suppressed (retain only INI-loading diagnostics)
    }
    
    void Engine::Shutdown() { 
        if (m_Renderer) {
            m_Renderer->Shutdown();
            m_Renderer.reset();
        }
        // WebView2 overlay is owned by the Editor; nothing to clean here.
        m_IsRunning = false; 
    }

    void Engine::TranslateCamera(const Plume::Vec3& delta) {
        if (m_ActiveScene) m_ActiveScene->TranslateCamera(delta);
    }

    void Engine::RotateCamera(const Plume::Vec3& delta) {
        if (m_ActiveScene) m_ActiveScene->RotateCamera(delta);
    }

    void Engine::TranslateCameraLocal(const Plume::Vec3& delta, bool followPitch) {
        if (m_ActiveScene) m_ActiveScene->TranslateCameraLocal(delta, followPitch);
    }

    void Engine::LoadPreviewAsset(const std::string& path) {
        // Init preview scene if needed (or reset it)
        m_PreviewScene = std::make_unique<Scene>();
        
        // Setup basic environment
        m_PreviewScene->CreateEntity("Preview_Light", EntityType::Light, "Directional");
        m_PreviewScene->CreateEntity("Preview_Camera", EntityType::Camera);
        
        // Setup Mesh
        // TODO: Pass actual path to importer once available
        // For now, subType "Cube" triggers the placeholder cube in Renderer
        auto mesh = m_PreviewScene->CreateEntity("Preview_Mesh", EntityType::Mesh, "Cube");
        
        // Center camera? 
        // Default camera is at -1.5, 2.0, -1.5 looking at origin slightly.
        
        m_ActiveScene = m_PreviewScene.get();
    }

    void Engine::StopPreview() {
        m_ActiveScene = m_Scene.get();
        // Optionally clear preview scene to save memory
        m_PreviewScene.reset();
    }

    float Engine::GetFrameTimeMs() const {
        return static_cast<float>(m_FrameTimeMs);
    }

    float Engine::GetFPS() const {
        return m_FPS;
    }

    void Engine::SetMaxFPS(int max) {
        m_MaxFPS = max;
    }

    int Engine::GetMaxFPS() const {
        return m_MaxFPS;
    }

    void Engine::SetVSync(bool on) {
        m_VSync = on;
        // If renderer/swapchain supports changing present mode, we could apply here
        if (m_Renderer) {
            // try to reconfigure swapchain present mode if supported (no-op default)
        }
    }

    bool Engine::GetVSync() const {
        return m_VSync;
    }
}
