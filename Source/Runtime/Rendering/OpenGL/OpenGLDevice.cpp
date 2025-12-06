#ifdef PLUME_OPENGL_ENABLED

#include "OpenGLDevice.h"
#include "OpenGLSwapChain.h"
#include "OpenGLCommandBuffer.h"

#ifdef _WIN32
#pragma comment(lib, "opengl32.lib")
#endif

namespace Plume {
namespace RHI {

    OpenGLDevice::OpenGLDevice() {}

    OpenGLDevice::~OpenGLDevice() {
        Shutdown();
    }

    bool OpenGLDevice::Initialize(void* windowHandle, uint32_t width, uint32_t height) {
        m_Width = width;
        m_Height = height;

        if (!CreateContext(windowHandle)) return false;

        // Create swap chain
        m_SwapChain = std::make_unique<OpenGLSwapChain>(this, width, height);
        
        // Create command buffer
        m_CommandBuffer = std::make_unique<OpenGLCommandBuffer>(this);

        // Set initial OpenGL state
#ifdef _WIN32
        wglMakeCurrent(m_DeviceContext, m_RenderContext);
#endif

        glEnable(GL_DEPTH_TEST);
        glDepthFunc(GL_LESS);
        glEnable(GL_CULL_FACE);
        glCullFace(GL_BACK);

        return true;
    }

    void OpenGLDevice::Shutdown() {
#ifdef _WIN32
        if (m_RenderContext) {
            wglMakeCurrent(nullptr, nullptr);
            wglDeleteContext(m_RenderContext);
            m_RenderContext = nullptr;
        }

        if (m_DeviceContext) {
            ReleaseDC(m_WindowHandle, m_DeviceContext);
            m_DeviceContext = nullptr;
        }
#endif

        m_CommandBuffer.reset();
        m_SwapChain.reset();
    }

    void OpenGLDevice::BeginFrame() {
#ifdef _WIN32
        wglMakeCurrent(m_DeviceContext, m_RenderContext);
#endif
        
        if (m_CommandBuffer) {
            m_CommandBuffer->Begin();
        }
    }

    void OpenGLDevice::EndFrame() {
        if (m_CommandBuffer) {
            m_CommandBuffer->End();
        }
    }

    void OpenGLDevice::Present() {
#ifdef _WIN32
        SwapBuffers(m_DeviceContext);
#endif
    }

    RHISwapChain* OpenGLDevice::GetSwapChain() {
        return m_SwapChain.get();
    }

    RHICommandBuffer* OpenGLDevice::GetCurrentCommandBuffer() {
        return m_CommandBuffer.get();
    }

    void OpenGLDevice::WaitIdle() {
        glFinish();
    }

    bool OpenGLDevice::CreateContext(void* windowHandle) {
#ifdef _WIN32
        m_WindowHandle = static_cast<HWND>(windowHandle);
        m_DeviceContext = GetDC(m_WindowHandle);
        
        if (!m_DeviceContext) return false;

        PIXELFORMATDESCRIPTOR pfd = {};
        pfd.nSize = sizeof(PIXELFORMATDESCRIPTOR);
        pfd.nVersion = 1;
        pfd.dwFlags = PFD_DRAW_TO_WINDOW | PFD_SUPPORT_OPENGL | PFD_DOUBLEBUFFER;
        pfd.iPixelType = PFD_TYPE_RGBA;
        pfd.cColorBits = 32;
        pfd.cDepthBits = 24;
        pfd.cStencilBits = 8;
        pfd.iLayerType = PFD_MAIN_PLANE;

        int pixelFormat = ChoosePixelFormat(m_DeviceContext, &pfd);
        if (!pixelFormat) return false;

        if (!SetPixelFormat(m_DeviceContext, pixelFormat, &pfd)) return false;

        m_RenderContext = wglCreateContext(m_DeviceContext);
        if (!m_RenderContext) return false;

        if (!wglMakeCurrent(m_DeviceContext, m_RenderContext)) return false;

        return true;
#else
        return false;
#endif
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_OPENGL_ENABLED
