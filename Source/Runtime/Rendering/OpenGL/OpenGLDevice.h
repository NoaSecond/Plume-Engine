#pragma once

#ifdef PLUME_OPENGL_ENABLED

#include "../RHI/RHIDevice.h"
#include "../RHI/RHISwapChain.h"
#include "../RHI/RHICommandBuffer.h"
#include <vector>
#include <memory>

#ifdef _WIN32
#include <windows.h>
#include <gl/GL.h>
#endif

namespace Plume {
namespace RHI {

    class OpenGLSwapChain;
    class OpenGLCommandBuffer;

    class OpenGLDevice : public RHIDevice {
    public:
        OpenGLDevice();
        ~OpenGLDevice() override;

        bool Initialize(void* windowHandle, uint32_t width, uint32_t height) override;
        void Shutdown() override;
        
        void BeginFrame() override;
        void EndFrame() override;
        void Present() override;

        RHISwapChain* GetSwapChain() override;
        RHICommandBuffer* GetCurrentCommandBuffer() override;

        void WaitIdle() override;

#ifdef _WIN32
        HDC GetDeviceContext() const { return m_DeviceContext; }
        HGLRC GetRenderContext() const { return m_RenderContext; }
#endif

    private:
        bool CreateContext(void* windowHandle);

#ifdef _WIN32
        HWND m_WindowHandle = nullptr;
        HDC m_DeviceContext = nullptr;
        HGLRC m_RenderContext = nullptr;
#endif

        std::unique_ptr<OpenGLSwapChain> m_SwapChain;
        std::unique_ptr<OpenGLCommandBuffer> m_CommandBuffer;
        
        uint32_t m_Width = 0;
        uint32_t m_Height = 0;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_OPENGL_ENABLED
