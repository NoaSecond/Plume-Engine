#include "Engine.h"
#include <Rendering/RHI/RHIDevice.h>
#include <Rendering/RHI/RHISwapChain.h>
#include <Rendering/RHI/RHICommandBuffer.h>
#include <thread>
#include <chrono>

namespace Plume {
    Engine::Engine() {}
    Engine::~Engine() { Shutdown(); }

    void Engine::Init() {
        m_Scene = std::make_unique<Scene>();
        m_Scene->CreateEntity("Scene_Root", EntityType::Folder);
        m_Scene->CreateEntity("Sun_Light", EntityType::Light, "Directional");
        m_Scene->CreateEntity("Main_Camera", EntityType::Camera);
        m_Scene->CreateEntity("Rotating_Cube_CPP", EntityType::Mesh, "Cube");
        m_IsRunning = true;
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
        }
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
    }

    void Engine::Run() {
        auto lastTime = std::chrono::high_resolution_clock::now();
        while (m_IsRunning) {
            auto currentTime = std::chrono::high_resolution_clock::now();
            float deltaTime = std::chrono::duration<float>(currentTime - lastTime).count();
            lastTime = currentTime;
            if (m_Scene) m_Scene->OnUpdate(deltaTime);
            RenderFrame();
            std::this_thread::sleep_for(std::chrono::milliseconds(16));
        }
    }
    
    void Engine::RenderFrame() {
        if (!m_Renderer) return;

        m_Renderer->BeginFrame();
        
        auto* cmdBuffer = m_Renderer->GetCurrentCommandBuffer();
        if (cmdBuffer) {
            cmdBuffer->BeginRenderPass();
            
            // Configure viewport et scissor
            auto* swapChain = m_Renderer->GetSwapChain();
            RHI::Viewport viewport;
            viewport.width = static_cast<float>(swapChain->GetWidth());
            viewport.height = static_cast<float>(swapChain->GetHeight());
            cmdBuffer->SetViewport(viewport);
            
            RHI::Scissor scissor;
            scissor.width = swapChain->GetWidth();
            scissor.height = swapChain->GetHeight();
            cmdBuffer->SetScissor(scissor);
            
            // TODO: Rendu de la scène 3D ici
            
            cmdBuffer->EndRenderPass();
        }
        
        m_Renderer->EndFrame();
        m_Renderer->Present();
    }
    
    void Engine::Shutdown() { 
        if (m_Renderer) {
            m_Renderer->Shutdown();
            m_Renderer.reset();
        }
        m_IsRunning = false; 
    }
}
