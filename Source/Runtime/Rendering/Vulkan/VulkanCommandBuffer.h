#pragma once

#ifdef PLUME_VULKAN_ENABLED

#include "../RHI/RHICommandBuffer.h"
#include <vulkan/vulkan.h>

namespace Plume {
namespace RHI {

    class VulkanDevice;

    class VulkanCommandBuffer : public RHICommandBuffer {
    public:
        VulkanCommandBuffer(VulkanDevice* device);
        ~VulkanCommandBuffer() override;

        void Begin() override;
        void End() override;

        void BeginRenderPass() override;
        void EndRenderPass() override;

        void SetViewport(const Viewport& viewport) override;
        void SetScissor(const Scissor& scissor) override;

        void Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) override;
        void DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) override;

        // --- High-level Refactored Methods ---
        void SetCamera(const Vec3& position, const Vec3& rotation, float fov, float aspect) override {}
        void SetLight(int index, const Vec3& position, const Vec3& color) override {}
        void DrawGrid(int size, float spacing) override {}
        void DrawGizmo() override {}
        void DrawMeshPlaceholder(const TransformComponent& transform) override {}
        void SetDepthTest(bool enabled) override {}

        VkCommandBuffer GetVkCommandBuffer() const { return m_CommandBuffer; }

    private:
        bool CreateCommandPool();
        bool AllocateCommandBuffer();

        VulkanDevice* m_Device;
        VkCommandPool m_CommandPool = VK_NULL_HANDLE;
        VkCommandBuffer m_CommandBuffer = VK_NULL_HANDLE;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_VULKAN_ENABLED
