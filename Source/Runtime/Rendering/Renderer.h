#pragma once
#include <memory>
#include <vector>
#include "../Core/Components.h"

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
    
    class Scene;
    
    namespace RHI {
        class RHIDevice;
        class RHICommandBuffer;
    }

    // Structure pour représenter un mesh basique
    struct Vertex {
        float position[3];
        float normal[3];
        float color[3];
    };

    class PLUME_API Renderer {
    public:
        Renderer(RHI::RHIDevice* device);
        ~Renderer();

        void RenderScene(Scene* scene, bool isPreview = false);
        
        // Set viewport rendering region (in screen coordinates)
        void SetViewportRegion(int x, int y, int width, int height) {
            m_ViewportX = x;
            m_ViewportY = y;
            m_ViewportWidth = width;
            m_ViewportHeight = height;
        }

        void SetPreviewViewportRegion(int x, int y, int width, int height) {
            m_PreviewViewportX = x;
            m_PreviewViewportY = y;
            m_PreviewViewportWidth = width;
            m_PreviewViewportHeight = height;
        }
        
    private:
        void RenderTestTriangle(RHI::RHICommandBuffer* cmdBuffer);
        void RenderTestCube(RHI::RHICommandBuffer* cmdBuffer);
        void RenderGrid(RHI::RHICommandBuffer* cmdBuffer);
        void RenderGizmo(RHI::RHICommandBuffer* cmdBuffer);
        void RenderMesh(RHI::RHICommandBuffer* cmdBuffer, const TransformComponent& transform, const std::string& meshPath);

        RHI::RHIDevice* m_Device;
        Scene* m_Scene = nullptr; // Current scene being rendered
        
        // Viewport region for rendering (set by editor)
        int m_ViewportX = 0;
        int m_ViewportY = 0;
        int m_ViewportWidth = 800;
        int m_ViewportHeight = 600;
        
        // Preview Viewport (Separate)
        int m_PreviewViewportX = 0;
        int m_PreviewViewportY = 0;
        int m_PreviewViewportWidth = 300;
        int m_PreviewViewportHeight = 300;
        
        // Ressources de test pour le MVP
        std::vector<Vertex> m_TestVertices;

        // Preview Support
        std::string m_OverrideVertShader;
        std::string m_OverrideFragShader;

    public:
        void SetOverrideShader(const std::string& vert, const std::string& frag) {
            m_OverrideVertShader = vert;
            m_OverrideFragShader = frag;
        }
    };

} // namespace Plume
