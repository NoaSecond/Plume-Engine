#pragma once

#ifdef PLUME_OPENGL_ENABLED

#include "../RHI/RHISwapChain.h"

namespace Plume {
namespace RHI {

    class OpenGLDevice;

    class OpenGLSwapChain : public RHISwapChain {
    public:
        OpenGLSwapChain(OpenGLDevice* device, uint32_t width, uint32_t height);
        ~OpenGLSwapChain() override;

        void Resize(uint32_t width, uint32_t height) override;
        uint32_t GetWidth() const override { return m_Width; }
        uint32_t GetHeight() const override { return m_Height; }
        uint32_t GetImageCount() const override { return 2; } // Double buffering

    private:
        OpenGLDevice* m_Device;
        uint32_t m_Width;
        uint32_t m_Height;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_OPENGL_ENABLED
