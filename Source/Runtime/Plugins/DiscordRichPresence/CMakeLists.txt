project(DiscordRichPresence)

# Fetch Discord Game SDK locally for this plugin
include(FetchContent)
FetchContent_Declare(
    discord_game_sdk
    URL https://dl-game-sdk.discordapp.net/3.2.1/discord_game_sdk.zip
)
FetchContent_MakeAvailable(discord_game_sdk)

set(PLUGIN_SOURCES
    "DiscordPresence.cpp"
    "DiscordPresence.h"
)

# Discord Game SDK Sources
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

add_library(DiscordRichPresence SHARED ${PLUGIN_SOURCES} ${DISCORD_SDK_SOURCES})

# Link against the engine runtime
target_link_libraries(DiscordRichPresence PRIVATE PlumeRuntime)

# Ensure the DLL is built into the main Bin directory
set_target_properties(DiscordRichPresence PROPERTIES 
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_RUNTIME_OUTPUT_DIRECTORY}
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}
    ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_ARCHIVE_OUTPUT_DIRECTORY}
)

# Include directories
target_include_directories(DiscordRichPresence PRIVATE 
    ${discord_game_sdk_SOURCE_DIR}/cpp
    ${CMAKE_SOURCE_DIR}/Source/Runtime
)

# Discord SDK Links
if(WIN32)
    target_link_libraries(DiscordRichPresence PRIVATE 
        ${discord_game_sdk_SOURCE_DIR}/lib/x86_64/discord_game_sdk.dll.lib
    )
    
    # Copy Discord DLL to output directory
    add_custom_command(TARGET DiscordRichPresence POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        "${discord_game_sdk_SOURCE_DIR}/lib/x86_64/discord_game_sdk.dll"
        "${CMAKE_RUNTIME_OUTPUT_DIRECTORY}/$<CONFIG>/discord_game_sdk.dll"
    )
endif()

message(STATUS "Configured plugin: DiscordRichPresence")
