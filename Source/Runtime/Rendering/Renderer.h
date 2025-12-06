#pragma once
#include <memory>
#include <vector>

#if defined(_WIN32)
    #ifdef PLUME_EXPORT
        #define PLUME_API __declspec(dllexport)
    #else
        #define PLUME_API __declspec(dllimport)
    #endif
#else
    #define PLUME_API
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

        void RenderScene(Scene* scene);
        
    private:
        void RenderTestTriangle(RHI::RHICommandBuffer* cmdBuffer);
        void RenderTestCube(RHI::RHICommandBuffer* cmdBuffer);

        RHI::RHIDevice* m_Device;
        
        // Ressources de test pour le MVP
        std::vector<Vertex> m_TestVertices;
    };

} // namespace Plume
