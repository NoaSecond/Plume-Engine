set(RUNTIME_SOURCES
    "Core/Engine.cpp"
    "Core/Engine.h"
    "Core/Scene.cpp"
    "Core/Scene.h"
    "Core/Components.h"
    "Core/Plugin.h"
    "Core/PluginManager.cpp"
    "Core/PluginManager.h"
)

# Rendering System (RHI + Vulkan + OpenGL + DirectX12 + Metal)
set(RENDERING_SOURCES
    "Rendering/Renderer.h"
    "Rendering/Renderer.cpp"
    "Rendering/RHI/RHIDevice.h"
    "Rendering/RHI/RHIDevice.cpp"
    "Rendering/RHI/RHISwapChain.h"
    "Rendering/RHI/RHICommandBuffer.h"
    "Rendering/RHI/RHITypes.h"
    "Rendering/Vulkan/VulkanDevice.h"
    "Rendering/Vulkan/VulkanDevice.cpp"
    "Rendering/Vulkan/VulkanSwapChain.h"
    "Rendering/Vulkan/VulkanSwapChain.cpp"
    "Rendering/Vulkan/VulkanCommandBuffer.h"
    "Rendering/Vulkan/VulkanCommandBuffer.cpp"
    "Rendering/OpenGL/OpenGLDevice.h"
    "Rendering/OpenGL/OpenGLDevice.cpp"
    "Rendering/OpenGL/OpenGLSwapChain.h"
    "Rendering/OpenGL/OpenGLSwapChain.cpp"
    "Rendering/OpenGL/OpenGLCommandBuffer.h"
    "Rendering/OpenGL/OpenGLCommandBuffer.cpp"
    "Rendering/DirectX12/DX12Device.h"
    "Rendering/DirectX12/DX12Device.cpp"
    "Rendering/DirectX12/DX12SwapChain.h"
    "Rendering/DirectX12/DX12SwapChain.cpp"
    "Rendering/DirectX12/DX12CommandBuffer.h"
    "Rendering/DirectX12/DX12CommandBuffer.cpp"
)

# Add Metal sources on macOS/iOS
if(APPLE)
    list(APPEND RENDERING_SOURCES
        "Rendering/Metal/MetalDevice.h"
        "Rendering/Metal/MetalDevice.mm"
        "Rendering/Metal/MetalSwapChain.h"
        "Rendering/Metal/MetalSwapChain.mm"
        "Rendering/Metal/MetalCommandBuffer.h"
        "Rendering/Metal/MetalCommandBuffer.mm"
    )
endif()

# Plugins
set(PLUGIN_DISCORD_SOURCES
    "Plugins/DiscordRichPresence/DiscordPresence.cpp"
    "Plugins/DiscordRichPresence/DiscordPresence.h"
)

# Discord Game SDK
set(DISCORD_SDK_SOURCES
    ${discord_game_sdk_SOURCE_DIR}/cpp/achievement_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/activity_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/application_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/core.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/image_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/lobby_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/network_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/overlay_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/relationship_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/storage_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/store_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/types.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/user_manager.cpp
    ${discord_game_sdk_SOURCE_DIR}/cpp/voice_manager.cpp
)

add_library(PlumeRuntime SHARED ${RUNTIME_SOURCES} ${RENDERING_SOURCES} ${PLUGIN_DISCORD_SOURCES} ${DISCORD_SDK_SOURCES})
target_include_directories(PlumeRuntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

# Inclure les headers du Discord Game SDK
target_include_directories(PlumeRuntime PRIVATE 
    ${discord_game_sdk_SOURCE_DIR}/cpp
)

# Find Vulkan SDK (optional)
find_package(Vulkan)
if(Vulkan_FOUND)
    message(STATUS "Vulkan SDK found: ${Vulkan_VERSION}")
    target_include_directories(PlumeRuntime PRIVATE ${Vulkan_INCLUDE_DIRS})
    target_link_libraries(PlumeRuntime PRIVATE ${Vulkan_LIBRARIES})
    target_compile_definitions(PlumeRuntime PRIVATE PLUME_VULKAN_ENABLED)
else()
    message(WARNING "Vulkan SDK not found. Vulkan rendering disabled.")
endif()

# OpenGL is always available on Windows
if(WIN32)
    target_compile_definitions(PlumeRuntime PRIVATE PLUME_OPENGL_ENABLED)
    target_link_libraries(PlumeRuntime PRIVATE opengl32)
    message(STATUS "OpenGL support enabled")
endif()

# DirectX 12 is available on Windows 10+
if(WIN32)
    target_compile_definitions(PlumeRuntime PRIVATE PLUME_DX12_ENABLED)
    target_link_libraries(PlumeRuntime PRIVATE d3d12 dxgi)
    message(STATUS "DirectX 12 support enabled")
endif()

# Metal is available on macOS/iOS
if(APPLE)
    target_compile_definitions(PlumeRuntime PRIVATE PLUME_METAL_ENABLED)
    find_library(METAL_LIBRARY Metal)
    find_library(QUARTZCORE_LIBRARY QuartzCore)
    target_link_libraries(PlumeRuntime PRIVATE ${METAL_LIBRARY} ${QUARTZCORE_LIBRARY})
    message(STATUS "Metal support enabled")
endif()

# Lier la bibliothèque Discord Game SDK
if(WIN32)
    target_compile_definitions(PlumeRuntime PRIVATE PLUME_EXPORT)
    target_link_libraries(PlumeRuntime PRIVATE 
        ${discord_game_sdk_SOURCE_DIR}/lib/x86_64/discord_game_sdk.dll.lib
    )
    
    # Copier la DLL Discord dans le dossier de sortie
    add_custom_command(TARGET PlumeRuntime POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${discord_game_sdk_SOURCE_DIR}/lib/x86_64/discord_game_sdk.dll"
        "${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/$<CONFIG>/discord_game_sdk.dll"
    )
endif()
