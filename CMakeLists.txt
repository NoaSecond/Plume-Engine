# ============================================================
#  Plume Engine - CMake configuration
# ============================================================

cmake_minimum_required(VERSION 3.15)
project(PlumeEngine LANGUAGES CXX)

# ============================================================
#  Configuration du compilateur
# ============================================================

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# ============================================================
#  Configuration de vcpkg
# ============================================================

if(NOT DEFINED VCPKG_ROOT)
    set(VCPKG_ROOT "C:/vcpkg" CACHE PATH "Path to vcpkg root directory")
endif()

if(NOT DEFINED VCPKG_TARGET_TRIPLET)
    set(VCPKG_TARGET_TRIPLET "x64-windows" CACHE STRING "vcpkg target triplet")
endif()

set(CMAKE_TOOLCHAIN_FILE "${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake"
    CACHE STRING "Vcpkg toolchain file")

message(STATUS "Using vcpkg from: ${VCPKG_ROOT}")
message(STATUS "Target triplet: ${VCPKG_TARGET_TRIPLET}")

# ============================================================
#  Options de compilation
# ============================================================

option(PLUME_ENABLE_IMGUI "Enable ImGui-based editor" ON)

if(PLUME_ENABLE_IMGUI)
    message(STATUS "PLUME_ENABLE_IMGUI requested; ImGui will be searched for below.")
else()
    message(STATUS "PLUME_ENABLE_IMGUI disabled.")
endif()

# ============================================================
#  Dépendances via vcpkg
# ============================================================

# SDL2
find_package(SDL2 CONFIG REQUIRED)
if(TARGET SDL2::SDL2)
    message(STATUS "Found SDL2 (modern config).")
elseif(TARGET SDL2::SDL2main)
    message(STATUS "Found SDL2main (legacy config).")
else()
    message(FATAL_ERROR "SDL2 not found. Install via vcpkg: vcpkg install sdl2:x64-windows")
endif()

# GLAD
find_package(glad CONFIG REQUIRED)
message(STATUS "Found glad")

# GLM
find_package(glm CONFIG REQUIRED)
message(STATUS "Found glm")

# ASSIMP
find_package(assimp CONFIG REQUIRED)
message(STATUS "Found assimp")

# stb (header-only)
find_path(STB_INCLUDE_DIRS "stb_c_lexer.h")
if(STB_INCLUDE_DIRS)
    message(STATUS "Found stb: ${STB_INCLUDE_DIRS}")
    add_library(stb INTERFACE)
    target_include_directories(stb INTERFACE ${STB_INCLUDE_DIRS})
else()
    message(WARNING "stb not found. Install via vcpkg: vcpkg install stb:x64-windows")
endif()

# EnTT (header-only)
find_path(ENTT_INCLUDE_DIRS "entt/entt.hpp")
if(ENTT_INCLUDE_DIRS)
    message(STATUS "Found EnTT: ${ENTT_INCLUDE_DIRS}")
    add_library(entt INTERFACE)
    target_include_directories(entt INTERFACE ${ENTT_INCLUDE_DIRS})
else()
    message(WARNING "EnTT not found. Install via vcpkg: vcpkg install entt:x64-windows")
endif()

# ============================================================
#  ImGui (vcpkg ou fallback FetchContent)
# ============================================================

if(PLUME_ENABLE_IMGUI)
    find_package(imgui CONFIG)
    if(imgui_FOUND)
        message(STATUS "Found ImGui via vcpkg.")
        set(PLUME_IMGUI_LIB imgui::imgui)
        # Ensure backend headers (imgui_impl_sdl.h) are present; some vcpkg ports don't install backends
        find_path(IMGUI_IMPL_SDL_H imgui_impl_sdl.h HINTS "${VCPKG_ROOT}/installed/${VCPKG_TARGET_TRIPLET}/include")
        if(NOT IMGUI_IMPL_SDL_H)
        message(STATUS "ImGui found via vcpkg but backend headers (imgui_impl_sdl.h) are missing. Fetching ImGui sources for backends (matching vcpkg version v1.91.9).")
                include(FetchContent)
                FetchContent_Declare(
                    imgui_backends
                    GIT_REPOSITORY https://github.com/ocornut/imgui.git
                    GIT_TAG v1.91.9
                )
            FetchContent_MakeAvailable(imgui_backends)
            # Add the imconfig and backends include directories from fetched content
            set(PLUME_IMGUI_BACKENDS_DIR ${imgui_backends_SOURCE_DIR}/backends)
            list(APPEND PLUME_EXTRA_INCLUDE_DIRS ${PLUME_IMGUI_BACKENDS_DIR})
        endif()
    else()
        message(WARNING "ImGui not found via vcpkg. Falling back to FetchContent.")
        include(FetchContent)
        FetchContent_Declare(
            imgui
            GIT_REPOSITORY https://github.com/ocornut/imgui.git
            GIT_TAG docking
        )
        FetchContent_MakeAvailable(imgui)
        add_library(imgui_lib INTERFACE)
        target_include_directories(imgui_lib INTERFACE ${imgui_SOURCE_DIR})
        set(PLUME_IMGUI_LIB imgui_lib)
    endif()
endif()

# ============================================================
#  Génération automatique de PlumeVersion.h
# ============================================================

set(PLUME_JSON_PATH "${CMAKE_SOURCE_DIR}/meta/plume.json")

if(EXISTS ${PLUME_JSON_PATH})
    file(READ "${PLUME_JSON_PATH}" PLUME_JSON_RAW)

    # Version extraction: "0.1.0.0"
    string(REGEX MATCH "\"version\"[ \t]*:[ \t]*\"([0-9]+)\\.([0-9]+)\\.([0-9]+)\\.([0-9]+)\"" _ ${PLUME_JSON_RAW})
    set(PLUME_VERSION_MAJOR ${CMAKE_MATCH_1})
    set(PLUME_VERSION_MINOR ${CMAKE_MATCH_2})
    set(PLUME_VERSION_PATCH ${CMAKE_MATCH_3})
    set(PLUME_VERSION_BUILD ${CMAKE_MATCH_4})
    set(PLUME_VERSION_STRING "${PLUME_VERSION_MAJOR}.${PLUME_VERSION_MINOR}.${PLUME_VERSION_PATCH}.${PLUME_VERSION_BUILD}")

    macro(plume_extract VAR FIELD)
        string(REGEX MATCH "\"${FIELD}\"[ \t]*:[ \t]*\"([^\"]*)\"" _ ${PLUME_JSON_RAW})
        set(${VAR} "${CMAKE_MATCH_1}")
    endmacro()

    plume_extract(PLUME_PRODUCT_NAME "product_name")
    plume_extract(PLUME_DESCRIPTION "description")
    plume_extract(PLUME_COMPANY "company")
    plume_extract(PLUME_COPYRIGHT "copyright")
    plume_extract(PLUME_AUTHOR "author")
    plume_extract(PLUME_COMMENTS "comments")

    # Génération du header
    configure_file(
        ${CMAKE_SOURCE_DIR}/src/Core/PlumeVersion.h.in
        ${CMAKE_BINARY_DIR}/generated/PlumeVersion.h
        @ONLY
    )

    set(PLUME_GENERATED_INCLUDE_DIR ${CMAKE_BINARY_DIR}/generated)
    message(STATUS "Generated PlumeVersion.h (v${PLUME_VERSION_STRING})")
else()
    message(WARNING "meta/plume.json not found! Skipping PlumeVersion.h generation.")
endif()

# ============================================================
#  Sources du projet
# ============================================================

file(GLOB_RECURSE PLUME_SOURCES "src/*.cpp" "src/*.h")

add_executable(PlumeEngine ${PLUME_SOURCES})

# Inclusion des headers générés
if(PLUME_GENERATED_INCLUDE_DIR)
    target_include_directories(PlumeEngine BEFORE PRIVATE ${PLUME_GENERATED_INCLUDE_DIR})
endif()

# Inclusion des headers sources
target_include_directories(PlumeEngine PRIVATE "src")

# ============================================================
#  Liens
# ============================================================

target_link_libraries(PlumeEngine
    PRIVATE
        SDL2::SDL2main
        SDL2::SDL2
        glad::glad
        glm::glm
        assimp::assimp
        ${PLUME_IMGUI_LIB}
        stb
        entt
)

if(PLUME_ENABLE_IMGUI)
    target_compile_definitions(PlumeEngine PRIVATE PLUME_ENABLE_IMGUI=1)
endif()

# If we fetched extra include dirs for ImGui backends, add them to the target
if(PLUME_EXTRA_INCLUDE_DIRS)
    target_include_directories(PlumeEngine PRIVATE ${PLUME_EXTRA_INCLUDE_DIRS})
endif()

# If we fetched ImGui backends via FetchContent (imgui_backends_SOURCE_DIR set),
# compile the SDL2 + OpenGL3 backend sources into the target so the symbols are available.
if(DEFINED imgui_backends_SOURCE_DIR)
    message(STATUS "Adding ImGui backend sources from ${imgui_backends_SOURCE_DIR}/backends")
    target_sources(PlumeEngine PRIVATE
        ${imgui_backends_SOURCE_DIR}/backends/imgui_impl_sdl2.cpp
        ${imgui_backends_SOURCE_DIR}/backends/imgui_impl_opengl3.cpp
    )
    target_include_directories(PlumeEngine PRIVATE ${imgui_backends_SOURCE_DIR}/backends)
endif()

# ============================================================
#  Informations finales
# ============================================================

message(STATUS "")
message(STATUS "===============================================")
message(STATUS "   Plume Engine configuration complete! ✅")
message(STATUS "   Build dir: ${CMAKE_BINARY_DIR}")
message(STATUS "   C++ standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "===============================================")
message(STATUS "")
