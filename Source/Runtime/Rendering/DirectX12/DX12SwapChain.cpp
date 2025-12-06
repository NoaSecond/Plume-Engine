#ifdef PLUME_DX12_ENABLED

#include "DX12SwapChain.h"
#include "DX12Device.h"

namespace Plume {
namespace RHI {

    DX12SwapChain::DX12SwapChain(DX12Device* device)
        : m_Device(device) {
    }

    DX12SwapChain::~DX12SwapChain() {
        Cleanup();
    }

    bool DX12SwapChain::Initialize(void* windowHandle, uint32_t width, uint32_t height) {
        m_Width = width;
        m_Height = height;

        DXGI_SWAP_CHAIN_DESC1 swapChainDesc = {};
        swapChainDesc.Width = width;
        swapChainDesc.Height = height;
        swapChainDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
        swapChainDesc.SampleDesc.Count = 1;
        swapChainDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
        swapChainDesc.BufferCount = FRAME_COUNT;
        swapChainDesc.SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD;

        ComPtr<IDXGIFactory4> factory;
        if (FAILED(CreateDXGIFactory2(0, IID_PPV_ARGS(&factory)))) {
            return false;
        }

        ComPtr<IDXGISwapChain1> swapChain;
        if (FAILED(factory->CreateSwapChainForHwnd(
            m_Device->GetCommandQueue(),
            static_cast<HWND>(windowHandle),
            &swapChainDesc,
            nullptr,
            nullptr,
            &swapChain))) {
            return false;
        }

        if (FAILED(swapChain.As(&m_SwapChain))) {
            return false;
        }

        return CreateRenderTargets();
    }

    void DX12SwapChain::Cleanup() {
        for (auto& rt : m_RenderTargets) {
            rt.Reset();
        }
        m_SwapChain.Reset();
    }

    void DX12SwapChain::Resize(uint32_t width, uint32_t height) {
        m_Device->WaitIdle();
        
        for (auto& rt : m_RenderTargets) {
            rt.Reset();
        }

        m_SwapChain->ResizeBuffers(FRAME_COUNT, width, height, DXGI_FORMAT_R8G8B8A8_UNORM, 0);
        m_Width = width;
        m_Height = height;

        CreateRenderTargets();
    }

    void DX12SwapChain::Present() {
        m_SwapChain->Present(1, 0);
    }

    uint32_t DX12SwapChain::GetCurrentBackBufferIndex() const {
        return m_SwapChain->GetCurrentBackBufferIndex();
    }

    bool DX12SwapChain::CreateRenderTargets() {
        for (UINT i = 0; i < FRAME_COUNT; i++) {
            if (FAILED(m_SwapChain->GetBuffer(i, IID_PPV_ARGS(&m_RenderTargets[i])))) {
                return false;
            }
        }
        return true;
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_DX12_ENABLED
