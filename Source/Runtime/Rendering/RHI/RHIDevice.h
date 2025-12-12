#pragma once
#include "RHITypes.h"
#include <memory>

#if defined(_WIN32)
    #ifdef PLUME_EXPORT
        #define PLUME_API __declspec(dllexport)
    #else
        #define PLUME_API __declspec(dllimport)
    #endif
#else
    #define PLUME_API
#endif

namespace Plume {
namespace RHI {

    class RHISwapChain;
    class RHICommandBuffer;

    class PLUME_API RHIDevice {
    public:
        virtual ~RHIDevice() = default;

        virtual bool Initialize(void* windowHandle, uint32_t width, uint32_t height) = 0;
        virtual void Shutdown() = 0;
        
        virtual void BeginFrame() = 0;
        virtual void EndFrame() = 0;
        virtual void Present() = 0;

        virtual RHISwapChain* GetSwapChain() = 0;
        virtual RHICommandBuffer* GetCurrentCommandBuffer() = 0;

        virtual void WaitIdle() = 0;

        static std::unique_ptr<RHIDevice> Create(GraphicsAPI api);
    };

} // namespace RHI
} // namespace Plume
