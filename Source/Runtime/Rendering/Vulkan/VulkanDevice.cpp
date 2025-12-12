#ifdef PLUME_VULKAN_ENABLED

#include "VulkanDevice.h"
#include "VulkanSwapChain.h"
#include "VulkanCommandBuffer.h"
#include <stdexcept>
#include <set>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>
#include <vulkan/vulkan_win32.h>
#endif

namespace Plume {
namespace RHI {

    VulkanDevice::VulkanDevice() {}

    VulkanDevice::~VulkanDevice() {
        Shutdown();
    }

    bool VulkanDevice::Initialize(void* windowHandle, uint32_t width, uint32_t height) {
        if (!CreateInstance()) return false;
        
#ifdef _DEBUG
        SetupDebugMessenger();
#endif

        if (!CreateSurface(windowHandle)) return false;
        if (!PickPhysicalDevice()) return false;
        if (!CreateLogicalDevice()) return false;

        // Create swap chain
        m_SwapChain = std::make_unique<VulkanSwapChain>(this);
        if (!m_SwapChain->Initialize(width, height)) {
            return false;
        }

        // Create command buffers
        m_CommandBuffers.resize(MAX_FRAMES_IN_FLIGHT);
        for (auto& cmdBuffer : m_CommandBuffers) {
            cmdBuffer = std::make_unique<VulkanCommandBuffer>(this);
        }

        // Create synchronization objects
        m_ImageAvailableSemaphores.resize(MAX_FRAMES_IN_FLIGHT);
        m_RenderFinishedSemaphores.resize(MAX_FRAMES_IN_FLIGHT);
        m_InFlightFences.resize(MAX_FRAMES_IN_FLIGHT);

        VkSemaphoreCreateInfo semaphoreInfo{};
        semaphoreInfo.sType = VK_STRUCTURE_TYPE_SEMAPHORE_CREATE_INFO;

        VkFenceCreateInfo fenceInfo{};
        fenceInfo.sType = VK_STRUCTURE_TYPE_FENCE_CREATE_INFO;
        fenceInfo.flags = VK_FENCE_CREATE_SIGNALED_BIT;

        for (size_t i = 0; i < MAX_FRAMES_IN_FLIGHT; i++) {
            if (vkCreateSemaphore(m_Device, &semaphoreInfo, nullptr, &m_ImageAvailableSemaphores[i]) != VK_SUCCESS ||
                vkCreateSemaphore(m_Device, &semaphoreInfo, nullptr, &m_RenderFinishedSemaphores[i]) != VK_SUCCESS ||
                vkCreateFence(m_Device, &fenceInfo, nullptr, &m_InFlightFences[i]) != VK_SUCCESS) {
                return false;
            }
        }

        return true;
    }

    void VulkanDevice::Shutdown() {
        if (m_Device) {
            vkDeviceWaitIdle(m_Device);

            for (size_t i = 0; i < MAX_FRAMES_IN_FLIGHT; i++) {
                if (m_ImageAvailableSemaphores[i]) vkDestroySemaphore(m_Device, m_ImageAvailableSemaphores[i], nullptr);
                if (m_RenderFinishedSemaphores[i]) vkDestroySemaphore(m_Device, m_RenderFinishedSemaphores[i], nullptr);
                if (m_InFlightFences[i]) vkDestroyFence(m_Device, m_InFlightFences[i], nullptr);
            }

            m_CommandBuffers.clear();
            m_SwapChain.reset();
            vkDestroyDevice(m_Device, nullptr);
            m_Device = VK_NULL_HANDLE;
        }

        if (m_Surface) {
            vkDestroySurfaceKHR(m_Instance, m_Surface, nullptr);
            m_Surface = VK_NULL_HANDLE;
        }

#ifdef _DEBUG
        if (m_DebugMessenger) {
            auto func = (PFN_vkDestroyDebugUtilsMessengerEXT)vkGetInstanceProcAddr(m_Instance, "vkDestroyDebugUtilsMessengerEXT");
            if (func) func(m_Instance, m_DebugMessenger, nullptr);
            m_DebugMessenger = VK_NULL_HANDLE;
        }
#endif

        if (m_Instance) {
            vkDestroyInstance(m_Instance, nullptr);
            m_Instance = VK_NULL_HANDLE;
        }
    }

    void VulkanDevice::BeginFrame() {
        vkWaitForFences(m_Device, 1, &m_InFlightFences[m_CurrentFrame], VK_TRUE, UINT64_MAX);

        VkResult result = vkAcquireNextImageKHR(m_Device, m_SwapChain->GetVkSwapChain(), 
            UINT64_MAX, m_ImageAvailableSemaphores[m_CurrentFrame], VK_NULL_HANDLE, &m_ImageIndex);

        if (result == VK_ERROR_OUT_OF_DATE_KHR) {
            // Swap chain needs recreation
            return;
        }

        vkResetFences(m_Device, 1, &m_InFlightFences[m_CurrentFrame]);
        m_CommandBuffers[m_CurrentFrame]->Begin();
    }

    void VulkanDevice::EndFrame() {
        m_CommandBuffers[m_CurrentFrame]->End();
    }

    void VulkanDevice::Present() {
        VkSubmitInfo submitInfo{};
        submitInfo.sType = VK_STRUCTURE_TYPE_SUBMIT_INFO;

        VkSemaphore waitSemaphores[] = { m_ImageAvailableSemaphores[m_CurrentFrame] };
        VkPipelineStageFlags waitStages[] = { VK_PIPELINE_STAGE_COLOR_ATTACHMENT_OUTPUT_BIT };
        submitInfo.waitSemaphoreCount = 1;
        submitInfo.pWaitSemaphores = waitSemaphores;
        submitInfo.pWaitDstStageMask = waitStages;

        VkCommandBuffer cmdBuffer = m_CommandBuffers[m_CurrentFrame]->GetVkCommandBuffer();
        submitInfo.commandBufferCount = 1;
        submitInfo.pCommandBuffers = &cmdBuffer;

        VkSemaphore signalSemaphores[] = { m_RenderFinishedSemaphores[m_CurrentFrame] };
        submitInfo.signalSemaphoreCount = 1;
        submitInfo.pSignalSemaphores = signalSemaphores;

        if (vkQueueSubmit(m_GraphicsQueue, 1, &submitInfo, m_InFlightFences[m_CurrentFrame]) != VK_SUCCESS) {
            // Handle error
        }

        VkPresentInfoKHR presentInfo{};
        presentInfo.sType = VK_STRUCTURE_TYPE_PRESENT_INFO_KHR;
        presentInfo.waitSemaphoreCount = 1;
        presentInfo.pWaitSemaphores = signalSemaphores;

        VkSwapchainKHR swapChains[] = { m_SwapChain->GetVkSwapChain() };
        presentInfo.swapchainCount = 1;
        presentInfo.pSwapchains = swapChains;
        presentInfo.pImageIndices = &m_ImageIndex;

        vkQueuePresentKHR(m_PresentQueue, &presentInfo);

        m_CurrentFrame = (m_CurrentFrame + 1) % MAX_FRAMES_IN_FLIGHT;
    }

    RHISwapChain* VulkanDevice::GetSwapChain() {
        return m_SwapChain.get();
    }

    RHICommandBuffer* VulkanDevice::GetCurrentCommandBuffer() {
        return m_CommandBuffers[m_CurrentFrame].get();
    }

    void VulkanDevice::WaitIdle() {
        if (m_Device) {
            vkDeviceWaitIdle(m_Device);
        }
    }

    bool VulkanDevice::CreateInstance() {
        VkApplicationInfo appInfo{};
        appInfo.sType = VK_STRUCTURE_TYPE_APPLICATION_INFO;
        appInfo.pApplicationName = "Plume Engine";
        appInfo.applicationVersion = VK_MAKE_VERSION(0, 1, 0);
        appInfo.pEngineName = "Plume";
        appInfo.engineVersion = VK_MAKE_VERSION(0, 1, 0);
        appInfo.apiVersion = VK_API_VERSION_1_2;

        VkInstanceCreateInfo createInfo{};
        createInfo.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
        createInfo.pApplicationInfo = &appInfo;

        std::vector<const char*> extensions = {
            VK_KHR_SURFACE_EXTENSION_NAME,
#ifdef _WIN32
            VK_KHR_WIN32_SURFACE_EXTENSION_NAME,
#endif
#ifdef _DEBUG
            VK_EXT_DEBUG_UTILS_EXTENSION_NAME
#endif
        };

        createInfo.enabledExtensionCount = static_cast<uint32_t>(extensions.size());
        createInfo.ppEnabledExtensionNames = extensions.data();

#ifdef _DEBUG
        const char* validationLayers[] = { "VK_LAYER_KHRONOS_validation" };
        createInfo.enabledLayerCount = 1;
        createInfo.ppEnabledLayerNames = validationLayers;
#else
        createInfo.enabledLayerCount = 0;
#endif

        return vkCreateInstance(&createInfo, nullptr, &m_Instance) == VK_SUCCESS;
    }

    bool VulkanDevice::PickPhysicalDevice() {
        uint32_t deviceCount = 0;
        vkEnumeratePhysicalDevices(m_Instance, &deviceCount, nullptr);
        
        if (deviceCount == 0) return false;

        std::vector<VkPhysicalDevice> devices(deviceCount);
        vkEnumeratePhysicalDevices(m_Instance, &deviceCount, devices.data());

        for (const auto& device : devices) {
            VkPhysicalDeviceProperties deviceProperties;
            vkGetPhysicalDeviceProperties(device, &deviceProperties);

            if (deviceProperties.deviceType == VK_PHYSICAL_DEVICE_TYPE_DISCRETE_GPU) {
                m_PhysicalDevice = device;
                return true;
            }
        }

        // Fallback to first device
        m_PhysicalDevice = devices[0];
        return true;
    }

    bool VulkanDevice::CreateLogicalDevice() {
        uint32_t queueFamilyCount = 0;
        vkGetPhysicalDeviceQueueFamilyProperties(m_PhysicalDevice, &queueFamilyCount, nullptr);

        std::vector<VkQueueFamilyProperties> queueFamilies(queueFamilyCount);
        vkGetPhysicalDeviceQueueFamilyProperties(m_PhysicalDevice, &queueFamilyCount, queueFamilies.data());

        uint32_t graphicsFamily = UINT32_MAX;
        uint32_t presentFamily = UINT32_MAX;

        for (uint32_t i = 0; i < queueFamilyCount; i++) {
            if (queueFamilies[i].queueFlags & VK_QUEUE_GRAPHICS_BIT) {
                graphicsFamily = i;
            }

            VkBool32 presentSupport = false;
            vkGetPhysicalDeviceSurfaceSupportKHR(m_PhysicalDevice, i, m_Surface, &presentSupport);
            if (presentSupport) {
                presentFamily = i;
            }

            if (graphicsFamily != UINT32_MAX && presentFamily != UINT32_MAX) {
                break;
            }
        }

        if (graphicsFamily == UINT32_MAX || presentFamily == UINT32_MAX) {
            return false;
        }

        m_GraphicsQueueFamily = graphicsFamily;
        m_PresentQueueFamily = presentFamily;

        std::set<uint32_t> uniqueQueueFamilies = { graphicsFamily, presentFamily };
        std::vector<VkDeviceQueueCreateInfo> queueCreateInfos;

        float queuePriority = 1.0f;
        for (uint32_t queueFamily : uniqueQueueFamilies) {
            VkDeviceQueueCreateInfo queueCreateInfo{};
            queueCreateInfo.sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO;
            queueCreateInfo.queueFamilyIndex = queueFamily;
            queueCreateInfo.queueCount = 1;
            queueCreateInfo.pQueuePriorities = &queuePriority;
            queueCreateInfos.push_back(queueCreateInfo);
        }

        VkPhysicalDeviceFeatures deviceFeatures{};

        VkDeviceCreateInfo createInfo{};
        createInfo.sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO;
        createInfo.queueCreateInfoCount = static_cast<uint32_t>(queueCreateInfos.size());
        createInfo.pQueueCreateInfos = queueCreateInfos.data();
        createInfo.pEnabledFeatures = &deviceFeatures;

        const char* deviceExtensions[] = { VK_KHR_SWAPCHAIN_EXTENSION_NAME };
        createInfo.enabledExtensionCount = 1;
        createInfo.ppEnabledExtensionNames = deviceExtensions;

        if (vkCreateDevice(m_PhysicalDevice, &createInfo, nullptr, &m_Device) != VK_SUCCESS) {
            return false;
        }

        vkGetDeviceQueue(m_Device, graphicsFamily, 0, &m_GraphicsQueue);
        vkGetDeviceQueue(m_Device, presentFamily, 0, &m_PresentQueue);

        return true;
    }

    bool VulkanDevice::CreateSurface(void* windowHandle) {
#ifdef _WIN32
        VkWin32SurfaceCreateInfoKHR createInfo{};
        createInfo.sType = VK_STRUCTURE_TYPE_WIN32_SURFACE_CREATE_INFO_KHR;
        createInfo.hwnd = static_cast<HWND>(windowHandle);
        createInfo.hinstance = GetModuleHandle(nullptr);

        return vkCreateWin32SurfaceKHR(m_Instance, &createInfo, nullptr, &m_Surface) == VK_SUCCESS;
#else
        return false;
#endif
    }

#ifdef _DEBUG
    static VKAPI_ATTR VkBool32 VKAPI_CALL debugCallback(
        VkDebugUtilsMessageSeverityFlagBitsEXT messageSeverity,
        VkDebugUtilsMessageTypeFlagsEXT messageType,
        const VkDebugUtilsMessengerCallbackDataEXT* pCallbackData,
        void* pUserData) {
        
        // Log Vulkan validation messages
        return VK_FALSE;
    }

    bool VulkanDevice::SetupDebugMessenger() {
        VkDebugUtilsMessengerCreateInfoEXT createInfo{};
        createInfo.sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_MESSENGER_CREATE_INFO_EXT;
        createInfo.messageSeverity = VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT | 
                                      VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT;
        createInfo.messageType = VK_DEBUG_UTILS_MESSAGE_TYPE_GENERAL_BIT_EXT | 
                                 VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT | 
                                 VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT;
        createInfo.pfnUserCallback = debugCallback;

        auto func = (PFN_vkCreateDebugUtilsMessengerEXT)vkGetInstanceProcAddr(m_Instance, "vkCreateDebugUtilsMessengerEXT");
        if (func) {
            return func(m_Instance, &createInfo, nullptr, &m_DebugMessenger) == VK_SUCCESS;
        }
        return false;
    }
#endif

} // namespace RHI
} // namespace Plume

#endif // PLUME_VULKAN_ENABLED
