#ifdef PLUME_VULKAN_ENABLED

#include "VulkanCommandBuffer.h"
#include "VulkanDevice.h"
#include "VulkanSwapChain.h"

namespace Plume {
namespace RHI {

    VulkanCommandBuffer::VulkanCommandBuffer(VulkanDevice* device)
        : m_Device(device) {
        CreateCommandPool();
        AllocateCommandBuffer();
    }

    VulkanCommandBuffer::~VulkanCommandBuffer() {
        VkDevice device = m_Device->GetDevice();
        
        if (m_CommandBuffer) {
            vkFreeCommandBuffers(device, m_CommandPool, 1, &m_CommandBuffer);
            m_CommandBuffer = VK_NULL_HANDLE;
        }

        if (m_CommandPool) {
            vkDestroyCommandPool(device, m_CommandPool, nullptr);
            m_CommandPool = VK_NULL_HANDLE;
        }
    }

    void VulkanCommandBuffer::Begin() {
        vkResetCommandBuffer(m_CommandBuffer, 0);

        VkCommandBufferBeginInfo beginInfo{};
        beginInfo.sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO;
        beginInfo.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;

        vkBeginCommandBuffer(m_CommandBuffer, &beginInfo);
    }

    void VulkanCommandBuffer::End() {
        vkEndCommandBuffer(m_CommandBuffer);
    }

    void VulkanCommandBuffer::BeginRenderPass() {
        VulkanSwapChain* swapChain = static_cast<VulkanSwapChain*>(m_Device->GetSwapChain());

        VkRenderPassBeginInfo renderPassInfo{};
        renderPassInfo.sType = VK_STRUCTURE_TYPE_RENDER_PASS_BEGIN_INFO;
        renderPassInfo.renderPass = swapChain->GetRenderPass();
        renderPassInfo.framebuffer = swapChain->GetFramebuffer(0); // TODO: Use correct index
        renderPassInfo.renderArea.offset = {0, 0};
        renderPassInfo.renderArea.extent = {swapChain->GetWidth(), swapChain->GetHeight()};

        VkClearValue clearValues[2];
        clearValues[0].color = {{0.1f, 0.1f, 0.15f, 1.0f}};
        clearValues[1].depthStencil = {1.0f, 0};

        renderPassInfo.clearValueCount = 2;
        renderPassInfo.pClearValues = clearValues;

        vkCmdBeginRenderPass(m_CommandBuffer, &renderPassInfo, VK_SUBPASS_CONTENTS_INLINE);
    }

    void VulkanCommandBuffer::EndRenderPass() {
        vkCmdEndRenderPass(m_CommandBuffer);
    }

    void VulkanCommandBuffer::SetViewport(const Viewport& viewport) {
        VkViewport vkViewport{};
        vkViewport.x = viewport.x;
        vkViewport.y = viewport.y;
        vkViewport.width = viewport.width;
        vkViewport.height = viewport.height;
        vkViewport.minDepth = viewport.minDepth;
        vkViewport.maxDepth = viewport.maxDepth;

        vkCmdSetViewport(m_CommandBuffer, 0, 1, &vkViewport);
    }

    void VulkanCommandBuffer::SetScissor(const Scissor& scissor) {
        VkRect2D vkScissor{};
        vkScissor.offset = {scissor.x, scissor.y};
        vkScissor.extent = {scissor.width, scissor.height};

        vkCmdSetScissor(m_CommandBuffer, 0, 1, &vkScissor);
    }

    void VulkanCommandBuffer::Draw(uint32_t vertexCount, uint32_t instanceCount, uint32_t firstVertex, uint32_t firstInstance) {
        vkCmdDraw(m_CommandBuffer, vertexCount, instanceCount, firstVertex, firstInstance);
    }

    void VulkanCommandBuffer::DrawIndexed(uint32_t indexCount, uint32_t instanceCount, uint32_t firstIndex, int32_t vertexOffset, uint32_t firstInstance) {
        vkCmdDrawIndexed(m_CommandBuffer, indexCount, instanceCount, firstIndex, vertexOffset, firstInstance);
    }

    bool VulkanCommandBuffer::CreateCommandPool() {
        VkCommandPoolCreateInfo poolInfo{};
        poolInfo.sType = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO;
        poolInfo.flags = VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT;
        poolInfo.queueFamilyIndex = m_Device->GetGraphicsQueueFamily();

        return vkCreateCommandPool(m_Device->GetDevice(), &poolInfo, nullptr, &m_CommandPool) == VK_SUCCESS;
    }

    bool VulkanCommandBuffer::AllocateCommandBuffer() {
        VkCommandBufferAllocateInfo allocInfo{};
        allocInfo.sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_ALLOCATE_INFO;
        allocInfo.commandPool = m_CommandPool;
        allocInfo.level = VK_COMMAND_BUFFER_LEVEL_PRIMARY;
        allocInfo.commandBufferCount = 1;

        return vkAllocateCommandBuffers(m_Device->GetDevice(), &allocInfo, &m_CommandBuffer) == VK_SUCCESS;
    }

} // namespace RHI
} // namespace Plume

#endif // PLUME_VULKAN_ENABLED
