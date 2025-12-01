cmake_minimum_required(VERSION 3.15)
project(PlumeEngine VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/Bin/Lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/Bin/Lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/Bin)

option(BUILD_EDITOR "Build the Plume Editor" ON)

# Fetch Discord Game SDK
include(FetchContent)
FetchContent_Declare(
    discord_game_sdk
    URL https://dl-game-sdk.discordapp.net/3.2.1/discord_game_sdk.zip
)
FetchContent_MakeAvailable(discord_game_sdk)

add_subdirectory(Source/Runtime)
if(BUILD_EDITOR)
    add_subdirectory(Source/Editor)
endif()
add_subdirectory(Source/Launcher)
