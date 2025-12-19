#include "Renderer.h"
#include "../Core/Scene.h"
#include "RHI/RHIDevice.h"
#include "RHI/RHICommandBuffer.h"
#include "RHI/RHISwapChain.h"
#include <cmath>

namespace Plume {

    Renderer::Renderer(RHI::RHIDevice* device)
        : m_Device(device) {
        
        // Initialisation des ressources de test si nécessaire
        m_TestVertices = {
            {{-0.5f, -0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {1.0f, 0.0f, 0.0f}},
            {{ 0.5f, -0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {0.0f, 1.0f, 0.0f}},
            {{ 0.5f,  0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {0.0f, 0.0f, 1.0f}},
            {{-0.5f,  0.5f,  0.5f}, {0.0f, 0.0f, 1.0f}, {1.0f, 1.0f, 0.0f}},
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
        
        m_Scene = scene;
        auto* cmdBuffer = m_Device->GetCurrentCommandBuffer();
        if (!cmdBuffer) return;

        // No BeginRenderPass here, it's called by Engine::RenderFrame or caller
        
        // Configure viewport and scissor
        RHI::Viewport viewport;
        viewport.x = static_cast<float>(m_ViewportX);
        viewport.y = static_cast<float>(m_ViewportY);
        viewport.width = static_cast<float>(m_ViewportWidth);
        viewport.height = static_cast<float>(m_ViewportHeight);
        cmdBuffer->SetViewport(viewport);

        RHI::Scissor scissor;
        scissor.x = m_ViewportX;
        scissor.y = m_ViewportY;
        scissor.width = m_ViewportWidth;
        scissor.height = m_ViewportHeight;
        cmdBuffer->SetScissor(scissor);

        // Setup Camera
        TransformComponent camTransform;
        bool hasCamera = scene->GetCameraTransform(camTransform);
        if (!hasCamera) {
            camTransform.Position = {0.0f, 5.0f, -10.0f};
            camTransform.Rotation = {20.0f, 0.0f, 0.0f};
        }
        float aspect = (float)m_ViewportWidth / (float)m_ViewportHeight;
        bool isOrtho = scene->GetProjectionMode() == Scene::ProjectionMode::Orthographic;
        float fovOrSize = isOrtho ? scene->GetOrthoSize() : 60.0f;
        cmdBuffer->SetCamera(camTransform.Position, camTransform.Rotation, fovOrSize, aspect, isOrtho);

        // Render Grid
        RenderGrid(cmdBuffer);
        
        // Setup Lights
        cmdBuffer->SetDepthTest(true);
        // We could iterate lights in scene here
        cmdBuffer->SetLight(0, { 50.0f, 50.0f, 50.0f }, { 1.0f, 1.0f, 1.0f });

        // Render Scene Entities
        for (const auto& entity : scene->m_Registry) {
            if (!entity.Visible) continue;
            
            if (entity.Type.Type == EntityType::Mesh) {
                RenderMesh(cmdBuffer, entity.Transform, entity.Type.SubType);
            }
        }
        
        // Render Gizmo
        RenderGizmo(cmdBuffer);
    }

    void Renderer::RenderGrid(RHI::RHICommandBuffer* cmdBuffer) {
        cmdBuffer->DrawGrid(2000, 1.0f);
    }

    void Renderer::RenderGizmo(RHI::RHICommandBuffer* cmdBuffer) {
        cmdBuffer->DrawGizmo();
    }

    void Renderer::RenderTestTriangle(RHI::RHICommandBuffer* cmdBuffer) {
        // cmdBuffer->Draw(3, 1, 0, 0);
    }

    void Renderer::RenderTestCube(RHI::RHICommandBuffer* cmdBuffer) {
        // cmdBuffer->DrawIndexed(36, 1, 0, 0, 0);
    }

    void Renderer::RenderMesh(RHI::RHICommandBuffer* cmdBuffer, const TransformComponent& transform, const std::string& meshPath) {
        cmdBuffer->DrawMeshPlaceholder(transform);
    }

} // namespace Plume
