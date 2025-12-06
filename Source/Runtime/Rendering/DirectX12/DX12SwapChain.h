#pragma once

#ifdef PLUME_DX12_ENABLED

#include "../RHI/RHISwapChain.h"
#include <wrl/client.h>
#include <d3d12.h>
#include <dxgi1_6.h>

using Microsoft::WRL::ComPtr;

namespace Plume {
namespace RHI {

    class DX12Device;

    class DX12SwapChain : public RHISwapChain {
    public:
        DX12SwapChain(DX12Device* device);
        ~DX12SwapChain() override;

        bool Initialize(void* windowHandle, uint32_t width, uint32_t height);
        void Cleanup();

        void Resize(uint32_t width, uint32_t height) override;
        uint32_t GetWidth() const override { return m_Width; }
        uint32_t GetHeight() const override { return m_Height; }
        uint32_t GetImageCount() const override { return FRAME_COUNT; }

        void Present();
        IDXGISwapChain3* GetSwapChain() const { return m_SwapChain.Get(); }
        ID3D12Resource* GetRenderTarget(uint32_t index) const { return m_RenderTargets[index].Get(); }
        uint32_t GetCurrentBackBufferIndex() const;

    private:
        bool CreateRenderTargets();

        DX12Device* m_Device;
        ComPtr<IDXGISwapChain3> m_SwapChain;
        
        static constexpr uint32_t FRAME_COUNT = 2;
        ComPtr<ID3D12Resource> m_RenderTargets[FRAME_COUNT];
        
        uint32_t m_Width = 0;
        uint32_t m_Height = 0;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_DX12_ENABLED
