#include "RHIDevice.h"

#ifdef PLUME_VULKAN_ENABLED
#include "../Vulkan/VulkanDevice.h"
#endif

#ifdef PLUME_OPENGL_ENABLED
#include "../OpenGL/OpenGLDevice.h"
#endif

#ifdef PLUME_DX12_ENABLED
#include "../DirectX12/DX12Device.h"
#endif

#ifdef PLUME_METAL_ENABLED
#include "../Metal/MetalDevice.h"
#endif

namespace Plume {
namespace RHI {

    std::unique_ptr<RHIDevice> RHIDevice::Create(GraphicsAPI api) {
        switch (api) {
            case GraphicsAPI::Vulkan:
#ifdef PLUME_VULKAN_ENABLED
                return std::make_unique<VulkanDevice>();
#else
                return nullptr;
#endif
            
            case GraphicsAPI::DirectX12:
#ifdef PLUME_DX12_ENABLED
                return std::make_unique<DX12Device>();
#else
                return nullptr;
#endif
            
            case GraphicsAPI::OpenGL:
#ifdef PLUME_OPENGL_ENABLED
                return std::make_unique<OpenGLDevice>();
#else
                return nullptr;
#endif
            
            case GraphicsAPI::Metal:
#ifdef PLUME_METAL_ENABLED
                return std::make_unique<MetalDevice>();
#else
                return nullptr;
#endif
            
            default:
                return nullptr;
        }
    }

} // namespace RHI
} // namespace Plume
