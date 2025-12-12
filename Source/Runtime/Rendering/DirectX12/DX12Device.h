#pragma once

#ifdef PLUME_DX12_ENABLED

#include "../RHI/RHIDevice.h"
#include "../RHI/RHISwapChain.h"
#include "../RHI/RHICommandBuffer.h"
#include <vector>
#include <memory>
#include <wrl/client.h>

#include <d3d12.h>
#include <dxgi1_6.h>

using Microsoft::WRL::ComPtr;

namespace Plume {
namespace RHI {

    class DX12SwapChain;
    class DX12CommandBuffer;

    class DX12Device : public RHIDevice {
    public:
        DX12Device();
        ~DX12Device() override;

        bool Initialize(void* windowHandle, uint32_t width, uint32_t height) override;
        void Shutdown() override;
        
        void BeginFrame() override;
        void EndFrame() override;
        void Present() override;

        RHISwapChain* GetSwapChain() override;
        RHICommandBuffer* GetCurrentCommandBuffer() override;

        void WaitIdle() override;

        ID3D12Device* GetDevice() const { return m_Device.Get(); }
        ID3D12CommandQueue* GetCommandQueue() const { return m_CommandQueue.Get(); }

    private:
        bool CreateDevice();
        bool CreateCommandQueue();

        ComPtr<IDXGIFactory4> m_Factory;
        ComPtr<ID3D12Device> m_Device;
        ComPtr<ID3D12CommandQueue> m_CommandQueue;

        std::unique_ptr<DX12SwapChain> m_SwapChain;
        std::vector<std::unique_ptr<DX12CommandBuffer>> m_CommandBuffers;
        
        uint32_t m_CurrentFrame = 0;
        static constexpr uint32_t FRAME_COUNT = 2;

        ComPtr<ID3D12Fence> m_Fence;
        UINT64 m_FenceValues[FRAME_COUNT] = {};
        HANDLE m_FenceEvent = nullptr;

#ifdef _DEBUG
        ComPtr<ID3D12Debug> m_DebugController;
#endif
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_DX12_ENABLED
