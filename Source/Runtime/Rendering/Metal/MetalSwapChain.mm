#ifdef PLUME_METAL_ENABLED

#include "MetalSwapChain.h"
#include "MetalDevice.h"

namespace Plume {
namespace RHI {

    MetalSwapChain::MetalSwapChain(MetalDevice* device)
        : m_Device(device) {
    }

    MetalSwapChain::~MetalSwapChain() {
        Cleanup();
    }

    bool MetalSwapChain::Initialize(void* windowHandle, uint32_t width, uint32_t height) {
#ifdef __APPLE__
        m_Width = width;
        m_Height = height;

        // Create CAMetalLayer
        m_MetalLayer = [CAMetalLayer layer];
        if (!m_MetalLayer) return false;
        
        [m_MetalLayer retain];
        m_MetalLayer.device = m_Device->GetMTLDevice();
        m_MetalLayer.pixelFormat = MTLPixelFormatBGRA8Unorm;
        m_MetalLayer.framebufferOnly = YES;
        m_MetalLayer.drawableSize = CGSizeMake(width, height);
        
        // Attach layer to window/view (platform specific)
        // This would need platform-specific code for NSView or UIView
        
        return true;
#else
        return false;
#endif
    }

    void MetalSwapChain::Cleanup() {
#ifdef __APPLE__
        if (m_CurrentDrawable) {
            [m_CurrentDrawable release];
            m_CurrentDrawable = nil;
        }
        
        if (m_MetalLayer) {
            [m_MetalLayer release];
            m_MetalLayer = nil;
        }
#endif
    }

    void MetalSwapChain::Resize(uint32_t width, uint32_t height) {
#ifdef __APPLE__
        m_Width = width;
        m_Height = height;
        
        if (m_MetalLayer) {
            m_MetalLayer.drawableSize = CGSizeMake(width, height);
        }
#endif
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_METAL_ENABLED
