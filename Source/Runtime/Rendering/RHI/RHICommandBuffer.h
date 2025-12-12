#pragma once
#include "RHITypes.h"

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
    };

} // namespace RHI
} // namespace Plume
