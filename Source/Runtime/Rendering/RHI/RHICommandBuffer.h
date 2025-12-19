#pragma once
#include "RHITypes.h"
#include "../../Core/Components.h"

namespace Plume {
namespace RHI {

    class RHICommandBuffer {
    public:
        virtual ~RHICommandBuffer() = default;

        virtual void Begin() = 0;
        virtual void End() = 0;

        virtual void BeginRenderPass() = 0;
        virtual void EndRenderPass() = 0;

        virtual void SetViewport(const Viewport& viewport) = 0;
        virtual void SetScissor(const Scissor& scissor) = 0;

        virtual void Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) = 0;
        virtual void DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) = 0;

        // --- High-level Refactored Methods (DIP/LSP fixes) ---
        virtual void SetCamera(const Vec3& position, const Vec3& rotation, float fov, float aspect) = 0;
        virtual void SetLight(int index, const Vec3& position, const Vec3& color) = 0;
        virtual void DrawGrid(int size, float spacing) = 0;
        virtual void DrawGizmo() = 0;
        virtual void DrawMeshPlaceholder(const TransformComponent& transform) = 0;
        virtual void SetDepthTest(bool enabled) = 0;
    };

} // namespace RHI
} // namespace Plume
