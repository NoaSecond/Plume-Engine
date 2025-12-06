#include "Renderer.h"
#include "../Core/Scene.h"
#include "RHI/RHIDevice.h"
#include "RHI/RHICommandBuffer.h"
#include "RHI/RHISwapChain.h"
#include <cmath>

namespace Plume {

    Renderer::Renderer(RHI::RHIDevice* device)
        : m_Device(device) {
        
        // Créer un cube de test simple
        // 8 vertices pour un cube
        m_TestVertices = {
            // Front face
            {{-0.5f, -0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {1.0f, 0.0f, 0.0f}},
            {{ 0.5f, -0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {0.0f, 1.0f, 0.0f}},
            {{ 0.5f,  0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {0.0f, 0.0f, 1.0f}},
            {{-0.5f,  0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {1.0f, 1.0f, 0.0f}},
            // Back face
            {{-0.5f, -0.5f, -0.5f}, {0.0f, 0.0f, -1.0f}, {1.0f, 0.0f, 1.0f}},
            {{ 0.5f, -0.5f, -0.5f}, {0.0f, 0.0f, -1.0f}, {0.0f, 1.0f, 1.0f}},
            {{ 0.5f,  0.5f, -0.5f}, {0.0f, 0.0f, -1.0f}, {1.0f, 1.0f, 1.0f}},
            {{-0.5f,  0.5f, -0.5f}, {0.0f, 0.0f, -1.0f}, {0.5f, 0.5f, 0.5f}}
        };
    }

    Renderer::~Renderer() {
    }

    void Renderer::RenderScene(Scene* scene) {
        if (!m_Device || !scene) return;

        auto* cmdBuffer = m_Device->GetCurrentCommandBuffer();
        if (!cmdBuffer) return;

        cmdBuffer->BeginRenderPass();
        
        // Configure viewport et scissor
        auto* swapChain = m_Device->GetSwapChain();
        RHI::Viewport viewport;
        viewport.width = static_cast<float>(swapChain->GetWidth());
        viewport.height = static_cast<float>(swapChain->GetHeight());
        cmdBuffer->SetViewport(viewport);
        
        RHI::Scissor scissor;
        scissor.width = swapChain->GetWidth();
        scissor.height = swapChain->GetHeight();
        cmdBuffer->SetScissor(scissor);
        
        // Pour le moment, on rend juste un triangle de test
        // TODO: Implémenter le rendu basé sur les entités de la scène
        RenderTestTriangle(cmdBuffer);
        
        cmdBuffer->EndRenderPass();
    }

    void Renderer::RenderTestTriangle(RHI::RHICommandBuffer* cmdBuffer) {
        // Triangle simple de test
        // TODO: Créer un vertex buffer et un pipeline graphics
        // Pour le moment, c'est juste un placeholder
        // Le vrai rendu nécessitera des shaders, vertex buffers, etc.
        
        // cmdBuffer->Draw(3, 1, 0, 0);
    }

    void Renderer::RenderTestCube(RHI::RHICommandBuffer* cmdBuffer) {
        // Cube simple de test
        // TODO: Implémenter avec vertex buffer et index buffer
        
        // cmdBuffer->DrawIndexed(36, 1, 0, 0, 0);
    }

} // namespace Plume
