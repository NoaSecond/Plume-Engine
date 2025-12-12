#pragma once

#ifdef PLUME_METAL_ENABLED

#include "../RHI/RHICommandBuffer.h"

#ifdef __APPLE__
#include <Metal/Metal.h>
#endif

namespace Plume {
namespace RHI {

    class MetalDevice;

    class MetalCommandBuffer : public RHICommandBuffer {
    public:
        MetalCommandBuffer(MetalDevice* device);
        ~MetalCommandBuffer() override;

        void Begin() override;
        void End() override;

        void BeginRenderPass() override;
        void EndRenderPass() override;

        void SetViewport(const Viewport& viewport) override;
        void SetScissor(const Scissor& scissor) override;

        void Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) override;
        void DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) override;

#ifdef __APPLE__
        id<MTLCommandBuffer> GetMTLCommandBuffer() const { return m_CommandBuffer; }
        id<MTLRenderCommandEncoder> GetRenderEncoder() const { return m_RenderEncoder; }
#endif

    private:
        MetalDevice* m_Device;

#ifdef __APPLE__
        id<MTLCommandBuffer> m_CommandBuffer = nil;
        id<MTLRenderCommandEncoder> m_RenderEncoder = nil;
        MTLRenderPassDescriptor* m_RenderPassDescriptor = nil;
#endif
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_METAL_ENABLED
