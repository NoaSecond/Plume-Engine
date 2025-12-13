#include "Renderer.h"
#include "../Core/Scene.h"
#include "RHI/RHIDevice.h"
#include "RHI/RHICommandBuffer.h"
#include "RHI/RHISwapChain.h"
#include <cmath>
#include <chrono>
#include <fstream>

#ifdef _WIN32
#include <windows.h>
#include <gl/GL.h>
#endif

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
        
        // Store scene reference for camera access
        m_Scene = scene;

        auto* cmdBuffer = m_Device->GetCurrentCommandBuffer();
        if (!cmdBuffer) return;

        cmdBuffer->BeginRenderPass();
        
        // Configure viewport et scissor to match the web UI viewport region
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

        // Diagnostics logging removed (only INI/load-related diagnostics are kept)
        
        // Render grid and gizmo
        RenderGrid(cmdBuffer);
        RenderGizmo(cmdBuffer);
        
        cmdBuffer->EndRenderPass();
    }

    void Renderer::RenderGrid(RHI::RHICommandBuffer* cmdBuffer) {
#ifdef _WIN32
        // Get camera transform from scene
        TransformComponent camTransform;
        bool hasCamera = false;
        if (m_Scene) {
            hasCamera = m_Scene->GetCameraTransform(camTransform);
        }

        // (removed diagnostics)
        
        // If no camera, use default transform
        if (!hasCamera) {
            camTransform.Position = {0.0f, 5.0f, -10.0f};
            camTransform.Rotation = {20.0f, 0.0f, 0.0f};
        }
        
        // Simple immediate mode grid at Y=0
        glMatrixMode(GL_PROJECTION);
        glLoadIdentity();
        float aspect = (float)m_ViewportWidth / (float)m_ViewportHeight;
        // Perspective projection (compute top/right from FOV)
        const float PI = 3.14159265358979323846f;
        float fov = 60.0f; // degrees
        float fovRad = fov * PI / 180.0f;
        float nearPlane = 0.1f;
        float farPlane = 1000.0f;
        float top = tanf(fovRad * 0.5f) * nearPlane;
        float right = top * aspect;
        glFrustum(-right, right, -top, top, nearPlane, farPlane);
        
        glMatrixMode(GL_MODELVIEW);
        glLoadIdentity();
        
        // Apply camera rotation (in reverse order: yaw then pitch)
        glRotatef(-camTransform.Rotation.z, 0.0f, 0.0f, 1.0f); // roll
        glRotatef(-camTransform.Rotation.x, 1.0f, 0.0f, 0.0f); // pitch
        glRotatef(-camTransform.Rotation.y, 0.0f, 1.0f, 0.0f); // yaw
        
        // Apply camera position (translate in opposite direction)
        glTranslatef(-camTransform.Position.x, -camTransform.Position.y, -camTransform.Position.z);
        
        // Grid lines
        // Draw grid lines in white on the ground plane
        const int gridSize = 2000;
        const float spacing = 1.0f;
        glEnable(GL_DEPTH_TEST);
        glDepthMask(GL_TRUE);
        glColor3f(1.0f, 1.0f, 1.0f);
        glBegin(GL_LINES);
        for (int i = -gridSize; i <= gridSize; i++) {
            // Lines along X
            glVertex3f(-gridSize * spacing, 0.0f, i * spacing);
            glVertex3f(gridSize * spacing, 0.0f, i * spacing);

            // Lines along Z
            glVertex3f(i * spacing, 0.0f, -gridSize * spacing);
            glVertex3f(i * spacing, 0.0f, gridSize * spacing);
        }
        glEnd();

        // (removed diagnostic overlay)
#endif
    }

    void Renderer::RenderGizmo(RHI::RHICommandBuffer* cmdBuffer) {
#ifdef _WIN32
        // Draw XYZ gizmo at origin
        glLineWidth(3.0f);
        glBegin(GL_LINES);
        
        // X axis - Red
        glColor3f(1.0f, 0.0f, 0.0f);
        glVertex3f(0.0f, 0.0f, 0.0f);
        glVertex3f(2.0f, 0.0f, 0.0f);
        
        // Y axis - Green
        glColor3f(0.0f, 1.0f, 0.0f);
        glVertex3f(0.0f, 0.0f, 0.0f);
        glVertex3f(0.0f, 2.0f, 0.0f);
        
        // Z axis - Blue
        glColor3f(0.0f, 0.0f, 1.0f);
        glVertex3f(0.0f, 0.0f, 0.0f);
        glVertex3f(0.0f, 0.0f, 2.0f);
        
        glEnd();
        glLineWidth(1.0f);
#endif
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
