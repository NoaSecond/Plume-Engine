#pragma once

#ifdef PLUME_VULKAN_ENABLED

#include "../RHI/RHIDevice.h"
#include "../RHI/RHISwapChain.h"
#include "../RHI/RHICommandBuffer.h"
#include <vector>
#include <memory>

#ifdef _WIN32
#define VK_USE_PLATFORM_WIN32_KHR
#endif

#include <vulkan/vulkan.h>

namespace Plume {
namespace RHI {

    class VulkanSwapChain;
    class VulkanCommandBuffer;

    class VulkanDevice : public RHIDevice {
    public:
        VulkanDevice();
        ~VulkanDevice() override;

        bool Initialize(void* windowHandle, uint32_t width, uint32_t height) override;
        void Shutdown() override;
        
        void BeginFrame() override;
        void EndFrame() override;
        void Present() override;

        RHISwapChain* GetSwapChain() override;
        RHICommandBuffer* GetCurrentCommandBuffer() override;

        void WaitIdle() override;

        VkInstance GetInstance() const { return m_Instance; }
        VkPhysicalDevice GetPhysicalDevice() const { return m_PhysicalDevice; }
        VkDevice GetDevice() const { return m_Device; }
        VkQueue GetGraphicsQueue() const { return m_GraphicsQueue; }
        uint32_t GetGraphicsQueueFamily() const { return m_GraphicsQueueFamily; }

    private:
        bool CreateInstance();
        bool PickPhysicalDevice();
        bool CreateLogicalDevice();
        bool CreateSurface(void* windowHandle);

        VkInstance m_Instance = VK_NULL_HANDLE;
        VkPhysicalDevice m_PhysicalDevice = VK_NULL_HANDLE;
        VkDevice m_Device = VK_NULL_HANDLE;
        VkSurfaceKHR m_Surface = VK_NULL_HANDLE;
        
        VkQueue m_GraphicsQueue = VK_NULL_HANDLE;
        VkQueue m_PresentQueue = VK_NULL_HANDLE;
        uint32_t m_GraphicsQueueFamily = 0;
        uint32_t m_PresentQueueFamily = 0;

        std::unique_ptr<VulkanSwapChain> m_SwapChain;
        std::vector<std::unique_ptr<VulkanCommandBuffer>> m_CommandBuffers;
        
        uint32_t m_CurrentFrame = 0;
        uint32_t m_ImageIndex = 0;
        
        std::vector<VkSemaphore> m_ImageAvailableSemaphores;
        std::vector<VkSemaphore> m_RenderFinishedSemaphores;
        std::vector<VkFence> m_InFlightFences;

        static constexpr uint32_t MAX_FRAMES_IN_FLIGHT = 2;

#ifdef _DEBUG
        VkDebugUtilsMessengerEXT m_DebugMessenger = VK_NULL_HANDLE;
        bool SetupDebugMessenger();
#endif
    };

} // namespace RHI
} // namespace Plume

#endif // PLUME_VULKAN_ENABLED
