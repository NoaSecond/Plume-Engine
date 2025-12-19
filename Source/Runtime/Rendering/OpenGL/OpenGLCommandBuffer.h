#pragma once

#ifdef PLUME_OPENGL_ENABLED

#include "../RHI/RHICommandBuffer.h"

namespace Plume {
namespace RHI {

    class OpenGLDevice;

    class OpenGLCommandBuffer : public RHICommandBuffer {
    public:
        OpenGLCommandBuffer(OpenGLDevice* device);
        ~OpenGLCommandBuffer() override;

        void Begin() override;
        void End() override;

        void BeginRenderPass() override;
        void EndRenderPass() override;

        void SetViewport(const Viewport& viewport) override;
        void SetScissor(const Scissor& scissor) override;

        void Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) override;
        void DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) override;

        // --- High-level Refactored Methods ---
        void SetCamera(const Vec3& position, const Vec3& rotation, float fov, float aspect) override;
        void SetLight(int index, const Vec3& position, const Vec3& color) override;
        void DrawGrid(int size, float spacing) override;
        void DrawGizmo() override;
        void DrawMeshPlaceholder(const TransformComponent& transform) override;
        void SetDepthTest(bool enabled) override;

    private:
        OpenGLDevice* m_Device;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_OPENGL_ENABLED
