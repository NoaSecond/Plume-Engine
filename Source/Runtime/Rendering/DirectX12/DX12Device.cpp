#ifdef PLUME_DX12_ENABLED

#include "DX12Device.h"
#include "DX12SwapChain.h"
#include "DX12CommandBuffer.h"

#pragma comment(lib, "d3d12.lib")
#pragma comment(lib, "dxgi.lib")

namespace Plume {
namespace RHI {

    DX12Device::DX12Device() {}

    DX12Device::~DX12Device() {
        Shutdown();
    }

    bool DX12Device::Initialize(void* windowHandle, uint32_t width, uint32_t height) {
#ifdef _DEBUG
        // Enable debug layer
        if (SUCCEEDED(D3D12GetDebugInterface(IID_PPV_ARGS(&m_DebugController)))) {
            m_DebugController->EnableDebugLayer();
        }
#endif

        if (!CreateDevice()) return false;
        if (!CreateCommandQueue()) return false;

        // Create swap chain
        m_SwapChain = std::make_unique<DX12SwapChain>(this);
        if (!m_SwapChain->Initialize(windowHandle, width, height)) {
            return false;
        }

        // Create command buffers
        m_CommandBuffers.resize(FRAME_COUNT);
        for (auto& cmdBuffer : m_CommandBuffers) {
            cmdBuffer = std::make_unique<DX12CommandBuffer>(this);
        }

        // Create fence
        if (FAILED(m_Device->CreateFence(0, D3D12_FENCE_FLAG_NONE, IID_PPV_ARGS(&m_Fence)))) {
            return false;
        }

        m_FenceEvent = CreateEvent(nullptr, FALSE, FALSE, nullptr);
        if (!m_FenceEvent) return false;

        return true;
    }

    void DX12Device::Shutdown() {
        WaitIdle();

        if (m_FenceEvent) {
            CloseHandle(m_FenceEvent);
            m_FenceEvent = nullptr;
        }

        m_CommandBuffers.clear();
        m_SwapChain.reset();
        m_Fence.Reset();
        m_CommandQueue.Reset();
        m_Device.Reset();
        m_Factory.Reset();

#ifdef _DEBUG
        m_DebugController.Reset();
#endif
    }

    void DX12Device::BeginFrame() {
        // Wait for previous frame
        const UINT64 fence = m_FenceValues[m_CurrentFrame];
        if (m_Fence->GetCompletedValue() < fence) {
            m_Fence->SetEventOnCompletion(fence, m_FenceEvent);
            WaitForSingleObject(m_FenceEvent, INFINITE);
        }

        m_CommandBuffers[m_CurrentFrame]->Begin();
    }

    void DX12Device::EndFrame() {
        m_CommandBuffers[m_CurrentFrame]->End();
    }

    void DX12Device::Present() {
        // Execute command list
        ID3D12CommandList* commandLists[] = { m_CommandBuffers[m_CurrentFrame]->GetCommandList() };
        m_CommandQueue->ExecuteCommandLists(1, commandLists);

        // Present
        m_SwapChain->Present();

        // Signal fence
        const UINT64 currentFenceValue = m_FenceValues[m_CurrentFrame];
        m_CommandQueue->Signal(m_Fence.Get(), currentFenceValue);
        
        m_CurrentFrame = (m_CurrentFrame + 1) % FRAME_COUNT;
        m_FenceValues[m_CurrentFrame] = currentFenceValue + 1;
    }

    RHISwapChain* DX12Device::GetSwapChain() {
        return m_SwapChain.get();
    }

    RHICommandBuffer* DX12Device::GetCurrentCommandBuffer() {
        return m_CommandBuffers[m_CurrentFrame].get();
    }

    void DX12Device::WaitIdle() {
        const UINT64 fence = m_FenceValues[m_CurrentFrame];
        m_CommandQueue->Signal(m_Fence.Get(), fence);
        m_Fence->SetEventOnCompletion(fence, m_FenceEvent);
        WaitForSingleObject(m_FenceEvent, INFINITE);
        m_FenceValues[m_CurrentFrame]++;
    }

    bool DX12Device::CreateDevice() {
        UINT dxgiFactoryFlags = 0;

#ifdef _DEBUG
        dxgiFactoryFlags |= DXGI_CREATE_FACTORY_DEBUG;
#endif

        if (FAILED(CreateDXGIFactory2(dxgiFactoryFlags, IID_PPV_ARGS(&m_Factory)))) {
            return false;
        }

        ComPtr<IDXGIAdapter1> adapter;
        for (UINT adapterIndex = 0; 
             SUCCEEDED(m_Factory->EnumAdapters1(adapterIndex, &adapter)); 
             ++adapterIndex) {
            
            DXGI_ADAPTER_DESC1 desc;
            adapter->GetDesc1(&desc);

            // Skip software adapter
            if (desc.Flags & DXGI_ADAPTER_FLAG_SOFTWARE) continue;

            // Try to create device
            if (SUCCEEDED(D3D12CreateDevice(adapter.Get(), D3D_FEATURE_LEVEL_11_0, IID_PPV_ARGS(&m_Device)))) {
                break;
            }
        }

        return m_Device != nullptr;
    }

    bool DX12Device::CreateCommandQueue() {
        D3D12_COMMAND_QUEUE_DESC queueDesc = {};
        queueDesc.Type = D3D12_COMMAND_LIST_TYPE_DIRECT;
        queueDesc.Flags = D3D12_COMMAND_QUEUE_FLAG_NONE;

        return SUCCEEDED(m_Device->CreateCommandQueue(&queueDesc, IID_PPV_ARGS(&m_CommandQueue)));
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_DX12_ENABLED
