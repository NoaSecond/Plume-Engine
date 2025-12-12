#pragma once

#ifdef PLUME_METAL_ENABLED

#include "../RHI/RHISwapChain.h"

#ifdef __APPLE__
#include <Metal/Metal.h>
#include <QuartzCore/CAMetalLayer.h>
#endif

namespace Plume {
namespace RHI {

    class MetalDevice;

    class MetalSwapChain : public RHISwapChain {
    public:
        MetalSwapChain(MetalDevice* device);
        ~MetalSwapChain() override;

        bool Initialize(void* windowHandle, uint32_t width, uint32_t height);
        void Cleanup();

        void Resize(uint32_t width, uint32_t height) override;
        uint32_t GetWidth() const override { return m_Width; }
        uint32_t GetHeight() const override { return m_Height; }
        uint32_t GetImageCount() const override { return 3; } // Triple buffering

#ifdef __APPLE__
        CAMetalLayer* GetMetalLayer() const { return m_MetalLayer; }
        id<CAMetalDrawable> GetCurrentDrawable() const { return m_CurrentDrawable; }
#endif

    private:
        MetalDevice* m_Device;
        uint32_t m_Width = 0;
        uint32_t m_Height = 0;

#ifdef __APPLE__
        CAMetalLayer* m_MetalLayer = nil;
        id<CAMetalDrawable> m_CurrentDrawable = nil;
#endif
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_METAL_ENABLED
