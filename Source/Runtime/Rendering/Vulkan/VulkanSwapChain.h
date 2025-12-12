#pragma once

#ifdef PLUME_VULKAN_ENABLED

#include "../RHI/RHISwapChain.h"
#include <vulkan/vulkan.h>
#include <vector>

namespace Plume {
namespace RHI {

    class VulkanDevice;

    class VulkanSwapChain : public RHISwapChain {
    public:
        VulkanSwapChain(VulkanDevice* device);
        ~VulkanSwapChain() override;

        bool Initialize(uint32_t width, uint32_t height);
        void Cleanup();

        void Resize(uint32_t width, uint32_t height) override;
        uint32_t GetWidth() const override { return m_Width; }
        uint32_t GetHeight() const override { return m_Height; }
        uint32_t GetImageCount() const override { return static_cast<uint32_t>(m_Images.size()); }

        VkSwapchainKHR GetVkSwapChain() const { return m_SwapChain; }
        VkFormat GetImageFormat() const { return m_ImageFormat; }
        VkImageView GetImageView(uint32_t index) const { return m_ImageViews[index]; }
        VkFramebuffer GetFramebuffer(uint32_t index) const { return m_Framebuffers[index]; }
        VkRenderPass GetRenderPass() const { return m_RenderPass; }

    private:
        bool CreateSwapChain(uint32_t width, uint32_t height);
        bool CreateImageViews();
        bool CreateRenderPass();
        bool CreateFramebuffers();
        bool CreateDepthResources();

        VulkanDevice* m_Device;
        VkSwapchainKHR m_SwapChain = VK_NULL_HANDLE;
        
        std::vector<VkImage> m_Images;
        std::vector<VkImageView> m_ImageViews;
        std::vector<VkFramebuffer> m_Framebuffers;
        
        VkFormat m_ImageFormat;
        VkExtent2D m_Extent;
        uint32_t m_Width = 0;
        uint32_t m_Height = 0;

        VkRenderPass m_RenderPass = VK_NULL_HANDLE;
        
        VkImage m_DepthImage = VK_NULL_HANDLE;
        VkDeviceMemory m_DepthImageMemory = VK_NULL_HANDLE;
        VkImageView m_DepthImageView = VK_NULL_HANDLE;
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_VULKAN_ENABLED
