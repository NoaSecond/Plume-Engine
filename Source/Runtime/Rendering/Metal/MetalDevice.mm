#ifdef PLUME_METAL_ENABLED

#include "MetalDevice.h"
#include "MetalSwapChain.h"
#include "MetalCommandBuffer.h"

namespace Plume {
namespace RHI {

    MetalDevice::MetalDevice() {}

    MetalDevice::~MetalDevice() {
        Shutdown();
    }

    bool MetalDevice::Initialize(void* windowHandle, uint32_t width, uint32_t height) {
#ifdef __APPLE__
        if (!CreateDevice()) return false;
        if (!CreateCommandQueue()) return false;

        // Create swap chain
        m_SwapChain = std::make_unique<MetalSwapChain>(this);
        if (!m_SwapChain->Initialize(windowHandle, width, height)) {
            return false;
        }

        // Create command buffers
        m_CommandBuffers.resize(FRAME_COUNT);
        for (auto& cmdBuffer : m_CommandBuffers) {
            cmdBuffer = std::make_unique<MetalCommandBuffer>(this);
        }

        return true;
#else
        return false;
#endif
    }

    void MetalDevice::Shutdown() {
#ifdef __APPLE__
        m_CommandBuffers.clear();
        m_SwapChain.reset();
        
        if (m_CommandQueue) {
            [m_CommandQueue release];
            m_CommandQueue = nil;
        }
        
        if (m_Device) {
            [m_Device release];
            m_Device = nil;
        }
        
        if (m_MetalLayer) {
            [m_MetalLayer release];
            m_MetalLayer = nil;
        }
#endif
    }

    void MetalDevice::BeginFrame() {
#ifdef __APPLE__
        m_CommandBuffers[m_CurrentFrame]->Begin();
#endif
    }

    void MetalDevice::EndFrame() {
#ifdef __APPLE__
        m_CommandBuffers[m_CurrentFrame]->End();
#endif
    }

    void MetalDevice::Present() {
#ifdef __APPLE__
        // Command buffer execution and presentation handled in MetalCommandBuffer
        m_CurrentFrame = (m_CurrentFrame + 1) % FRAME_COUNT;
#endif
    }

    RHISwapChain* MetalDevice::GetSwapChain() {
        return m_SwapChain.get();
    }

    RHICommandBuffer* MetalDevice::GetCurrentCommandBuffer() {
        return m_CommandBuffers[m_CurrentFrame].get();
    }

    void MetalDevice::WaitIdle() {
#ifdef __APPLE__
        // Metal automatically synchronizes, but we can flush the command queue
        if (m_CommandQueue) {
            id<MTLCommandBuffer> cmdBuffer = [m_CommandQueue commandBuffer];
            [cmdBuffer commit];
            [cmdBuffer waitUntilCompleted];
        }
#endif
    }

    bool MetalDevice::CreateDevice() {
#ifdef __APPLE__
        m_Device = MTLCreateSystemDefaultDevice();
        if (!m_Device) {
            return false;
        }
        [m_Device retain];
        return true;
#else
        return false;
#endif
    }

    bool MetalDevice::CreateCommandQueue() {
#ifdef __APPLE__
        if (!m_Device) return false;
        
        m_CommandQueue = [m_Device newCommandQueue];
        if (!m_CommandQueue) {
            return false;
        }
        [m_CommandQueue retain];
        return true;
#else
        return false;
#endif
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_METAL_ENABLED
