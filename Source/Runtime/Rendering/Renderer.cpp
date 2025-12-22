#include "Renderer.h"
#include "../Core/Scene.h"
#include "RHI/RHIDevice.h"
#include "RHI/RHICommandBuffer.h"
#include "RHI/RHISwapChain.h"

#include "./OpenGL/OpenGLLoader.h"
#include <cmath>

namespace Plume {

    Renderer::Renderer(RHI::RHIDevice* device)
        : m_Device(device) {
        
        // Initialize OpenGL Extensions for shader support
        RHI::LoadOpenGLExtensions();
        
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

    void Renderer::RenderScene(Scene* scene, bool isPreview) {
        if (!m_Device || !scene) return;
        
        m_Scene = scene;
        auto* cmdBuffer = m_Device->GetCurrentCommandBuffer();
        if (!cmdBuffer) return;

        // Determine which viewport to use
        int vx = isPreview ? m_PreviewViewportX : m_ViewportX;
        int vy = isPreview ? m_PreviewViewportY : m_ViewportY;
        int vw = isPreview ? m_PreviewViewportWidth : m_ViewportWidth;
        int vh = isPreview ? m_PreviewViewportHeight : m_ViewportHeight;

        // No BeginRenderPass here, it's called by Engine::RenderFrame or caller
        
        // Configure viewport and scissor
        RHI::Viewport viewport;
        viewport.x = static_cast<float>(vx);
        viewport.y = static_cast<float>(vy);
        viewport.width = static_cast<float>(vw);
        viewport.height = static_cast<float>(vh);
        cmdBuffer->SetViewport(viewport);

        RHI::Scissor scissor;
        scissor.x = vx;
        scissor.y = vy;
        scissor.width = vw;
        scissor.height = vh;
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
                // If this is the "Preview_Mesh" and we have an override shader, set it
                if (entity.Tag.Name == "Preview_Mesh" && !m_OverrideVertShader.empty() && !m_OverrideFragShader.empty()) {
                    cmdBuffer->SetMaterialShader(m_OverrideVertShader, m_OverrideFragShader);
                    // Use DrawMesh (generic) instead of specific placeholder
                    cmdBuffer->DrawMesh(entity.Transform);
                } else {
                    RenderMesh(cmdBuffer, entity.Transform, entity.Type.SubType);
                }
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
