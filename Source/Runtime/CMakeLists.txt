set(RUNTIME_SOURCES
    "Core/Engine.cpp"
    "Core/Engine.h"
    "Core/Scene.cpp"
    "Core/Scene.h"
    "Core/Components.h"
    "Core/DiscordPresence.cpp"
    "Core/DiscordPresence.h"
)

# Sources du Discord Game SDK
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

add_library(PlumeRuntime SHARED ${RUNTIME_SOURCES} ${DISCORD_SDK_SOURCES})
target_include_directories(PlumeRuntime PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

# Inclure les headers du Discord Game SDK
target_include_directories(PlumeRuntime PRIVATE 
    ${discord_game_sdk_SOURCE_DIR}/cpp
)

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
