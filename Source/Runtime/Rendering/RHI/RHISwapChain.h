#pragma once
#include <cstdint>

namespace Plume {
namespace RHI {

    class RHISwapChain {
    public:
        virtual ~RHISwapChain() = default;

        virtual void Resize(uint32_t width, uint32_t height) = 0;
        virtual uint32_t GetWidth() const = 0;
        virtual uint32_t GetHeight() const = 0;
        virtual uint32_t GetImageCount() const = 0;
    };

} // namespace RHI
} // namespace Plume
