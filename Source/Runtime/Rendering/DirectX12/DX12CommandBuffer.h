#pragma once

#ifdef PLUME_DX12_ENABLED

#include "../RHI/RHICommandBuffer.h"
#include <wrl/client.h>
#include <d3d12.h>

using Microsoft::WRL::ComPtr;

namespace Plume {
namespace RHI {

    class DX12Device;

    class DX12CommandBuffer : public RHICommandBuffer {
    public:
        DX12CommandBuffer(DX12Device* device);
        ~DX12CommandBuffer() override;

        void Begin() override;
        void End() override;

        void BeginRenderPass() override;
        void EndRenderPass() override;

        void SetViewport(const Viewport& viewport) override;
        void SetScissor(const Scissor& scissor) override;

        void Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) override;
        void DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) override;

        // --- High-level Refactored Methods ---
        void SetCamera(const Vec3& position, const Vec3& rotation, float fovOrSize, float aspect, bool orthographic = false) override {}
        void SetLight(int index, const Vec3& position, const Vec3& color) override {}
        void DrawGrid(int size, float spacing) override {}
        void DrawGizmo() override {}
        void DrawMeshPlaceholder(const TransformComponent& transform) override {}
        void SetDepthTest(bool enabled) override {}
        void SetMaterialShader(const std::string& vert, const std::string& frag) override {}
        void DrawMesh(const TransformComponent& transform) override {}

        ID3D12GraphicsCommandList* GetCommandList() const { return m_CommandList.Get(); }

    private:
        bool CreateCommandAllocator();
        bool CreateCommandList();

        DX12Device* m_Device;
        ComPtr<ID3D12CommandAllocator> m_CommandAllocator;
        ComPtr<ID3D12GraphicsCommandList> m_CommandList;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_DX12_ENABLED
