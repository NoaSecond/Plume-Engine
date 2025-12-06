#ifdef PLUME_METAL_ENABLED

#include "MetalCommandBuffer.h"
#include "MetalDevice.h"
#include "MetalSwapChain.h"

namespace Plume {
namespace RHI {

    MetalCommandBuffer::MetalCommandBuffer(MetalDevice* device)
        : m_Device(device) {
    }

    MetalCommandBuffer::~MetalCommandBuffer() {
#ifdef __APPLE__
        if (m_RenderEncoder) {
            [m_RenderEncoder release];
            m_RenderEncoder = nil;
        }
        
        if (m_CommandBuffer) {
            [m_CommandBuffer release];
            m_CommandBuffer = nil;
        }
        
        if (m_RenderPassDescriptor) {
            [m_RenderPassDescriptor release];
            m_RenderPassDescriptor = nil;
        }
#endif
    }

    void MetalCommandBuffer::Begin() {
#ifdef __APPLE__
        if (m_CommandBuffer) {
            [m_CommandBuffer release];
        }
        
        m_CommandBuffer = [m_Device->GetCommandQueue() commandBuffer];
        [m_CommandBuffer retain];
#endif
    }

    void MetalCommandBuffer::End() {
#ifdef __APPLE__
        if (m_RenderEncoder) {
            [m_RenderEncoder endEncoding];
            [m_RenderEncoder release];
            m_RenderEncoder = nil;
        }
        
        if (m_CommandBuffer) {
            auto* swapChain = static_cast<MetalSwapChain*>(m_Device->GetSwapChain());
            id<CAMetalDrawable> drawable = swapChain->GetCurrentDrawable();
            
            if (drawable) {
                [m_CommandBuffer presentDrawable:drawable];
            }
            
            [m_CommandBuffer commit];
        }
#endif
    }

    void MetalCommandBuffer::BeginRenderPass() {
#ifdef __APPLE__
        auto* swapChain = static_cast<MetalSwapChain*>(m_Device->GetSwapChain());
        CAMetalLayer* layer = swapChain->GetMetalLayer();
        
        if (!layer) return;
        
        id<CAMetalDrawable> drawable = [layer nextDrawable];
        if (!drawable) return;
        
        // Create render pass descriptor
        if (m_RenderPassDescriptor) {
            [m_RenderPassDescriptor release];
        }
        
        m_RenderPassDescriptor = [MTLRenderPassDescriptor renderPassDescriptor];
        [m_RenderPassDescriptor retain];
        
        // Configure color attachment
        m_RenderPassDescriptor.colorAttachments[0].texture = drawable.texture;
        m_RenderPassDescriptor.colorAttachments[0].loadAction = MTLLoadActionClear;
        m_RenderPassDescriptor.colorAttachments[0].storeAction = MTLStoreActionStore;
        m_RenderPassDescriptor.colorAttachments[0].clearColor = MTLClearColorMake(0.1, 0.1, 0.15, 1.0);
        
        // Create render encoder
        m_RenderEncoder = [m_CommandBuffer renderCommandEncoderWithDescriptor:m_RenderPassDescriptor];
        [m_RenderEncoder retain];
#endif
    }

    void MetalCommandBuffer::EndRenderPass() {
#ifdef __APPLE__
        if (m_RenderEncoder) {
            [m_RenderEncoder endEncoding];
            [m_RenderEncoder release];
            m_RenderEncoder = nil;
        }
#endif
    }

    void MetalCommandBuffer::SetViewport(const Viewport& viewport) {
#ifdef __APPLE__
        if (!m_RenderEncoder) return;
        
        MTLViewport mtlViewport;
        mtlViewport.originX = viewport.x;
        mtlViewport.originY = viewport.y;
        mtlViewport.width = viewport.width;
        mtlViewport.height = viewport.height;
        mtlViewport.znear = viewport.minDepth;
        mtlViewport.zfar = viewport.maxDepth;
        
        [m_RenderEncoder setViewport:mtlViewport];
#endif
    }

    void MetalCommandBuffer::SetScissor(const Scissor& scissor) {
#ifdef __APPLE__
        if (!m_RenderEncoder) return;
        
        MTLScissorRect mtlScissor;
        mtlScissor.x = scissor.x;
        mtlScissor.y = scissor.y;
        mtlScissor.width = scissor.width;
        mtlScissor.height = scissor.height;
        
        [m_RenderEncoder setScissorRect:mtlScissor];
#endif
    }

    void MetalCommandBuffer::Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) {
#ifdef __APPLE__
        if (!m_RenderEncoder) return;
        
        [m_RenderEncoder drawPrimitives:MTLPrimitiveTypeTriangle
                             vertexStart:firstVertex
                             vertexCount:vertexCount
                           instanceCount:instanceCount
                            baseInstance:firstInstance];
#endif
    }

    void MetalCommandBuffer::DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) {
#ifdef __APPLE__
        if (!m_RenderEncoder) return;
        
        // TODO: Implement indexed drawing when we have index buffers
        // [m_RenderEncoder drawIndexedPrimitives:MTLPrimitiveTypeTriangle
        //                             indexCount:indexCount
        //                              indexType:MTLIndexTypeUInt32
        //                            indexBuffer:indexBuffer
        //                      indexBufferOffset:firstIndex * sizeof(uint32_t)
        //                          instanceCount:instanceCount
        //                             baseVertex:vertexOffset
        //                           baseInstance:firstInstance];
#endif
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_METAL_ENABLED
