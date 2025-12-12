#ifdef PLUME_DX12_ENABLED

#include "DX12CommandBuffer.h"
#include "DX12Device.h"
#include "DX12SwapChain.h"

namespace Plume {
namespace RHI {

    DX12CommandBuffer::DX12CommandBuffer(DX12Device* device)
        : m_Device(device) {
        CreateCommandAllocator();
        CreateCommandList();
    }

    DX12CommandBuffer::~DX12CommandBuffer() {
        m_CommandList.Reset();
        m_CommandAllocator.Reset();
    }

    void DX12CommandBuffer::Begin() {
        m_CommandAllocator->Reset();
        m_CommandList->Reset(m_CommandAllocator.Get(), nullptr);
    }

    void DX12CommandBuffer::End() {
        m_CommandList->Close();
    }

    void DX12CommandBuffer::BeginRenderPass() {
        auto* swapChain = static_cast<DX12SwapChain*>(m_Device->GetSwapChain());
        uint32_t backBufferIndex = swapChain->GetCurrentBackBufferIndex();
        auto* renderTarget = swapChain->GetRenderTarget(backBufferIndex);

        // Transition to render target
        D3D12_RESOURCE_BARRIER barrier = {};
        barrier.Type = D3D12_RESOURCE_BARRIER_TYPE_TRANSITION;
        barrier.Transition.pResource = renderTarget;
        barrier.Transition.StateBefore = D3D12_RESOURCE_STATE_PRESENT;
        barrier.Transition.StateAfter = D3D12_RESOURCE_STATE_RENDER_TARGET;
        barrier.Transition.Subresource = D3D12_RESOURCE_BARRIER_ALL_SUBRESOURCES;
        
        m_CommandList->ResourceBarrier(1, &barrier);

        // Clear render target
        // TODO: Create descriptor heap and RTV
        const float clearColor[] = { 0.1f, 0.1f, 0.15f, 1.0f };
        // m_CommandList->ClearRenderTargetView(rtvHandle, clearColor, 0, nullptr);
    }

    void DX12CommandBuffer::EndRenderPass() {
        auto* swapChain = static_cast<DX12SwapChain*>(m_Device->GetSwapChain());
        uint32_t backBufferIndex = swapChain->GetCurrentBackBufferIndex();
        auto* renderTarget = swapChain->GetRenderTarget(backBufferIndex);

        // Transition to present
        D3D12_RESOURCE_BARRIER barrier = {};
        barrier.Type = D3D12_RESOURCE_BARRIER_TYPE_TRANSITION;
        barrier.Transition.pResource = renderTarget;
        barrier.Transition.StateBefore = D3D12_RESOURCE_STATE_RENDER_TARGET;
        barrier.Transition.StateAfter = D3D12_RESOURCE_STATE_PRESENT;
        barrier.Transition.Subresource = D3D12_RESOURCE_BARRIER_ALL_SUBRESOURCES;
        
        m_CommandList->ResourceBarrier(1, &barrier);
    }

    void DX12CommandBuffer::SetViewport(const Viewport& viewport) {
        D3D12_VIEWPORT vp = {};
        vp.TopLeftX = viewport.x;
        vp.TopLeftY = viewport.y;
        vp.Width = viewport.width;
        vp.Height = viewport.height;
        vp.MinDepth = viewport.minDepth;
        vp.MaxDepth = viewport.maxDepth;

        m_CommandList->RSSetViewports(1, &vp);
    }

    void DX12CommandBuffer::SetScissor(const Scissor& scissor) {
        D3D12_RECT rect = {};
        rect.left = scissor.x;
        rect.top = scissor.y;
        rect.right = scissor.x + scissor.width;
        rect.bottom = scissor.y + scissor.height;

        m_CommandList->RSSetScissorRects(1, &rect);
    }

    void DX12CommandBuffer::Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) {
        m_CommandList->DrawInstanced(vertexCount, instanceCount, firstVertex, firstInstance);
    }

    void DX12CommandBuffer::DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) {
        m_CommandList->DrawIndexedInstanced(indexCount, instanceCount, firstIndex, vertexOffset, firstInstance);
    }

    bool DX12CommandBuffer::CreateCommandAllocator() {
        return SUCCEEDED(m_Device->GetDevice()->CreateCommandAllocator(
            D3D12_COMMAND_LIST_TYPE_DIRECT,
            IID_PPV_ARGS(&m_CommandAllocator)
        ));
    }

    bool DX12CommandBuffer::CreateCommandList() {
        return SUCCEEDED(m_Device->GetDevice()->CreateCommandList(
            0,
            D3D12_COMMAND_LIST_TYPE_DIRECT,
            m_CommandAllocator.Get(),
            nullptr,
            IID_PPV_ARGS(&m_CommandList)
        )) && SUCCEEDED(m_CommandList->Close());
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_DX12_ENABLED
