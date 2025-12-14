cmake_minimum_required(VERSION 3.15)
project(PlumeEngine VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/Bin/Lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/Bin/Lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/Bin)

option(BUILD_EDITOR "Build the Plume Editor" ON)

add_subdirectory(Source/Runtime)
if(BUILD_EDITOR)
    add_subdirectory(Source/Editor)
endif()
add_subdirectory(Source/Launcher)
