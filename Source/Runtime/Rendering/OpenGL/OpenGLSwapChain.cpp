#ifdef PLUME_OPENGL_ENABLED

#include "OpenGLSwapChain.h"
#include "OpenGLDevice.h"

namespace Plume {
namespace RHI {

    OpenGLSwapChain::OpenGLSwapChain(OpenGLDevice* device, uint32_t width, uint32_t height)
        : m_Device(device), m_Width(width), m_Height(height) {
    }

    OpenGLSwapChain::~OpenGLSwapChain() {
    }

    void OpenGLSwapChain::Resize(uint32_t width, uint32_t height) {
        m_Width = width;
        m_Height = height;
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_OPENGL_ENABLED
