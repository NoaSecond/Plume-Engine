#pragma once

#ifdef PLUME_METAL_ENABLED

#include "../RHI/RHIDevice.h"
#include "../RHI/RHISwapChain.h"
#include "../RHI/RHICommandBuffer.h"
#include <vector>
#include <memory>

#ifdef __APPLE__
#include <Metal/Metal.h>
#include <QuartzCore/CAMetalLayer.h>
#endif

namespace Plume {
namespace RHI {

    class MetalSwapChain;
    class MetalCommandBuffer;

    class MetalDevice : public RHIDevice {
    public:
        MetalDevice();
        ~MetalDevice() override;

        bool Initialize(void* windowHandle, uint32_t width, uint32_t height) override;
        void Shutdown() override;
        
        void BeginFrame() override;
        void EndFrame() override;
        void Present() override;

        RHISwapChain* GetSwapChain() override;
        RHICommandBuffer* GetCurrentCommandBuffer() override;

        void WaitIdle() override;

#ifdef __APPLE__
        id<MTLDevice> GetMTLDevice() const { return m_Device; }
        id<MTLCommandQueue> GetCommandQueue() const { return m_CommandQueue; }
#endif

    private:
        bool CreateDevice();
        bool CreateCommandQueue();

#ifdef __APPLE__
        id<MTLDevice> m_Device = nil;
        id<MTLCommandQueue> m_CommandQueue = nil;
        CAMetalLayer* m_MetalLayer = nil;
#endif

        std::unique_ptr<MetalSwapChain> m_SwapChain;
        std::vector<std::unique_ptr<MetalCommandBuffer>> m_CommandBuffers;
        
        uint32_t m_CurrentFrame = 0;
        static constexpr uint32_t FRAME_COUNT = 2;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_METAL_ENABLED
