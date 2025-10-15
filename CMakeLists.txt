# Version minimale de CMake requise
cmake_minimum_required(VERSION 3.15)
project(PlumeEngine)

# Définir la norme C++17 pour le projet
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_CXX_EXTENSIONS OFF)

# Option to enable ImGui-based editor
option(PLUME_ENABLE_IMGUI "Enable ImGui-based editor" OFF)
if(PLUME_ENABLE_IMGUI)
  message(STATUS "PLUME_ENABLE_IMGUI requested; ImGui will be searched for below.")
else()
  message(STATUS "PLUME_ENABLE_IMGUI disabled")
endif()

# --- GESTION DES DÉPENDANCES ---
# On utilise vcpkg pour les bibliothèques qui fonctionnent bien
set(CMAKE_TOOLCHAIN_FILE "C:/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "Vcpkg toolchain file")
find_package(SDL2 CONFIG REQUIRED)
find_package(glad CONFIG REQUIRED)
find_package(glm CONFIG REQUIRED)
find_package(assimp CONFIG REQUIRED)

# Use FetchContent for vendoring dependencies (needed for auto-vendoring ImGui)
include(FetchContent)

# Helper: function to vendor ImGui via FetchContent when find_package(imgui) fails
function(vendor_imgui_if_needed)
  if(NOT TARGET imgui::imgui)
    message(STATUS "Config: imgui::imgui not found, FetchContent'ing Dear ImGui...")
    FetchContent_Declare(
      dear_imgui
      GIT_REPOSITORY https://github.com/ocornut/imgui.git
      GIT_TAG        v1.92.4
    )
    # Populate (download + make available) Dear ImGui via FetchContent
    FetchContent_MakeAvailable(dear_imgui)

    add_library(imgui_static STATIC
      ${dear_imgui_SOURCE_DIR}/imgui.cpp
      ${dear_imgui_SOURCE_DIR}/imgui_draw.cpp
      ${dear_imgui_SOURCE_DIR}/imgui_tables.cpp
      ${dear_imgui_SOURCE_DIR}/imgui_widgets.cpp
      ${dear_imgui_SOURCE_DIR}/imgui_demo.cpp
    )
    target_include_directories(imgui_static PUBLIC ${dear_imgui_SOURCE_DIR})
    add_library(imgui::imgui ALIAS imgui_static)
  else()
    message(STATUS "imgui::imgui target already available from find_package or previous vendor step")
  endif()
endfunction()
if(PLUME_ENABLE_IMGUI)
  # Try to find ImGui (vcpkg port installs cmake config)
  find_package(imgui CONFIG)
  if(NOT imgui_FOUND)
    # Prefer a local vendored copy inside src/ThirdParty/imgui/ if present.
    if(EXISTS ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui/imgui.h)
      message(STATUS "Found local vendored ImGui under src/ThirdParty/imgui. Creating imgui::imgui target from local sources.")
      add_library(imgui_static STATIC
        ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui/imgui.cpp
        ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui/imgui_draw.cpp
        ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui/imgui_tables.cpp
        ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui/imgui_widgets.cpp
        ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui/imgui_demo.cpp
      )
      target_include_directories(imgui_static PUBLIC ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui)
      add_library(imgui::imgui ALIAS imgui_static)
      set(imgui_FOUND TRUE)
      message(STATUS "Using local vendored ImGui")
    else()
      message(STATUS "ImGui not found via find_package(imgui). Attempting to vendor via FetchContent...")
      vendor_imgui_if_needed()
      if(TARGET imgui::imgui)
        set(imgui_FOUND TRUE)
        message(STATUS "ImGui vendored successfully via FetchContent")
      else()
        message(WARNING "Failed to vendor ImGui automatically. Ensure imgui is installed via vcpkg or vendor a local copy at src/ThirdParty/imgui. Disabling PLUME_ENABLE_IMGUI.")
        set(PLUME_ENABLE_IMGUI OFF CACHE BOOL "Enable ImGui-based editor" FORCE)
      endif()
    endif()
  else()
    # Only define the compile macro if ImGui was found
    add_compile_definitions(PLUME_ENABLE_IMGUI)
    message(STATUS "PLUME_ENABLE_IMGUI enabled")
  endif()
endif()

FetchContent_Declare(
  entt
  GIT_REPOSITORY https://github.com/skypjack/entt.git
  GIT_TAG        v3.13.0
)

FetchContent_Declare(
  entt
  GIT_REPOSITORY https://github.com/skypjack/entt.git
  GIT_TAG        v3.13.0
)
FetchContent_MakeAvailable(entt)

FetchContent_Declare( # <-- NOUVEAU BLOC POUR STB
  stb
  GIT_REPOSITORY https://github.com/nothings/stb.git
  GIT_TAG        master # stb n'a pas de "releases", on utilise la version principale
)
FetchContent_MakeAvailable(stb)
# --- FIN DU BLOC ---

# Collecter tous les fichiers sources du projet
file(GLOB_RECURSE SOURCES "src/*.cpp")

# Définir l'exécutable
add_executable(PlumeEngine ${SOURCES})

# Spécifier les chemins d'inclusion
target_include_directories(PlumeEngine PRIVATE 
    src
    ${entt_SOURCE_DIR}/src
    ${stb_SOURCE_DIR} # <-- AJOUTER LE CHEMIN POUR STB
  ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui_backends
)

# --- Centralized version / metadata defaults (override with -D on cmake configure) ---
# NOTE: JSON in meta/plume.json will override these values if present
set(PLUME_FILE_VERSION_MAJOR 0)
set(PLUME_FILE_VERSION_MINOR 1)
set(PLUME_FILE_VERSION_PATCH 0)
set(PLUME_FILE_VERSION_BUILD 0)

set(PLUME_FILE_DESCRIPTION "A modern, lightweight 3D game engine written in C++ with multi-backend rendering architecture.")
set(PLUME_PRODUCT_NAME "Plume Engine")
set(PLUME_COMPANY_NAME "Noa Second")
set(PLUME_LEGAL_COPYRIGHT "©2025 Noa Second. All rights reserved.")
set(PLUME_INTERNAL_NAME "PlumeEngine")
set(PLUME_ORIGINAL_FILENAME "PlumeEngine.exe")
set(PLUME_COMMENTS "")

# --- Read meta/plume.json if present and override defaults ---
set(PLUME_META_JSON "${CMAKE_SOURCE_DIR}/meta/plume.json")
if(EXISTS ${PLUME_META_JSON})
  file(READ ${PLUME_META_JSON} _plume_json_content)

  function(read_json_value key outvar)
    # Simple regex: "key"\s*:\s*"([^"]*)"
    string(REGEX MATCH "\"${key}\"[ \\t]*:[ \\t]*\"([^\"]*)\"" _match "${_plume_json_content}")
    if(_match)
      # extract capture group 1
      string(REGEX REPLACE "\"${key}\"[ \\t]*:[ \\t]*\"([^\"]*)\"" "\\1" _value "${_match}")
      set(${outvar} "${_value}" PARENT_SCOPE)
    endif()
  endfunction()

  read_json_value("product_name" PLUME_JSON_PRODUCT_NAME)
  read_json_value("version" PLUME_JSON_VERSION)
  read_json_value("description" PLUME_JSON_DESCRIPTION)
  read_json_value("company" PLUME_JSON_COMPANY)
  read_json_value("copyright" PLUME_JSON_COPYRIGHT)
  read_json_value("author" PLUME_JSON_AUTHOR)
  read_json_value("comments" PLUME_JSON_COMMENTS)

  if(DEFINED PLUME_JSON_PRODUCT_NAME)
    set(PLUME_PRODUCT_NAME "${PLUME_JSON_PRODUCT_NAME}")
  endif()
  if(DEFINED PLUME_JSON_DESCRIPTION)
    set(PLUME_FILE_DESCRIPTION "${PLUME_JSON_DESCRIPTION}")
  endif()
  if(DEFINED PLUME_JSON_COMPANY)
    set(PLUME_COMPANY_NAME "${PLUME_JSON_COMPANY}")
  endif()
  if(DEFINED PLUME_JSON_COPYRIGHT)
    set(PLUME_LEGAL_COPYRIGHT "${PLUME_JSON_COPYRIGHT}")
  endif()
  if(DEFINED PLUME_JSON_COMMENTS)
    set(PLUME_COMMENTS "${PLUME_JSON_COMMENTS}")
  endif()

  if(DEFINED PLUME_JSON_VERSION)
    # Expect format major.minor.patch.build
    string(REPLACE "." ";" _ver_parts "${PLUME_JSON_VERSION}")
    list(LENGTH _ver_parts _ver_count)
    if(_ver_count GREATER 0)
      list(GET _ver_parts 0 PLUME_FILE_VERSION_MAJOR)
    endif()
    if(_ver_count GREATER 1)
      list(GET _ver_parts 1 PLUME_FILE_VERSION_MINOR)
    endif()
    if(_ver_count GREATER 2)
      list(GET _ver_parts 2 PLUME_FILE_VERSION_PATCH)
    endif()
    if(_ver_count GREATER 3)
      list(GET _ver_parts 3 PLUME_FILE_VERSION_BUILD)
    endif()
  endif()
endif()

# Generate PlumeVersion.h from template and add generated include dir
set(PLUME_FILE_VERSION "${PLUME_FILE_VERSION_MAJOR},${PLUME_FILE_VERSION_MINOR},${PLUME_FILE_VERSION_PATCH},${PLUME_FILE_VERSION_BUILD}")
string(REPLACE "," "." PLUME_FILE_VERSION_STR "${PLUME_FILE_VERSION}")

if(NOT DEFINED PLUME_PRODUCT_VERSION)
  set(PLUME_PRODUCT_VERSION ${PLUME_FILE_VERSION})
endif()
string(REPLACE "," "." PLUME_PRODUCT_VERSION_STR "${PLUME_PRODUCT_VERSION}")

# Generate PlumeVersion.h from template and add generated include dir
configure_file(${CMAKE_SOURCE_DIR}/src/Version/PlumeVersion.h.in
               ${CMAKE_BINARY_DIR}/generated/PlumeVersion.h @ONLY)
target_include_directories(PlumeEngine PRIVATE ${CMAKE_BINARY_DIR}/generated)

# Lier toutes les bibliothèques
target_link_libraries(PlumeEngine PRIVATE
    SDL2::SDL2
    SDL2::SDL2main
    glad::glad
    glm::glm
    assimp::assimp
    # Pas besoin de lier entt ou stb car elles sont "header-only"
)

if(PLUME_ENABLE_IMGUI AND imgui_FOUND)
  target_link_libraries(PlumeEngine PRIVATE imgui::imgui)
endif()

# If ImGui backends were vendored in the tree, add their include dir and
# compile the backend implementation files when the editor is enabled.
target_include_directories(PlumeEngine PRIVATE ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui_backends)

if(PLUME_ENABLE_IMGUI)
  # Vendored backends (SDL2 + OpenGL3) - compile them into the executable.
  target_sources(PlumeEngine PRIVATE
    ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui_backends/imgui_impl_sdl2.cpp
    ${CMAKE_SOURCE_DIR}/src/ThirdParty/imgui_backends/imgui_impl_opengl3.cpp
  )
  # If we created/found an imgui target, propagate its include dirs to our target so headers resolve
  if(TARGET imgui::imgui)
    get_target_property(_imgui_includes imgui::imgui INTERFACE_INCLUDE_DIRECTORIES)
    if(_imgui_includes)
      target_include_directories(PlumeEngine PRIVATE ${_imgui_includes})
    endif()
    # Link to the imgui target
    target_link_libraries(PlumeEngine PRIVATE imgui::imgui)
  endif()
endif()

# Copier les assets dans le dossier de build après la compilation
add_custom_command(TARGET PlumeEngine POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    ${CMAKE_SOURCE_DIR}/assets $<TARGET_FILE_DIR:PlumeEngine>/assets
    COMMENT "Copying assets to build directory"
)

# Copy runtime DLLs from vcpkg installed tree (Windows) to output directory
if(WIN32)
  # Option to disable vcpkg applocal invocations (some systems don't have pwsh.exe)
  option(PLUME_VCPKG_APPLOCAL "Run vcpkg applocal helper to copy runtime DLLs" OFF)

  # Common vcpkg install root and triplet; allow override via VCPKG_ROOT or VCPKG_TARGET_TRIPLET
  if(NOT DEFINED VCPKG_ROOT)
    set(VCPKG_ROOT "C:/vcpkg")
  endif()
  if(NOT DEFINED VCPKG_TARGET_TRIPLET)
    set(VCPKG_TARGET_TRIPLET "x64-windows")
  endif()

  set(VCPKG_BIN_DIR "${VCPKG_ROOT}/installed/${VCPKG_TARGET_TRIPLET}/bin")

  if(EXISTS "${VCPKG_BIN_DIR}")
    add_custom_command(TARGET PlumeEngine POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E echo "Copying vcpkg runtime DLLs from ${VCPKG_BIN_DIR} to output"
      COMMAND ${CMAKE_COMMAND} -E copy_directory
          "${VCPKG_BIN_DIR}" $<TARGET_FILE_DIR:PlumeEngine>
      COMMENT "Copying vcpkg runtime DLLs to build output"
    )
  else()
    message(STATUS "vcpkg bin dir not found: ${VCPKG_BIN_DIR}. If runtime DLLs are missing at runtime, set VCPKG_ROOT or copy required DLLs manually.")
  endif()
endif()

# --- Windows application icon resource ---
if(WIN32)
  # Path to the icon in the source tree (choose a 256px ICO provided in assets)
  set(PLUME_ICON_SRC "${CMAKE_SOURCE_DIR}/assets/icons/PlumeEngineIcon_256px.ico")
  # Convert to a CMake-style path (forward slashes) for the .rc file
  file(TO_CMAKE_PATH "${PLUME_ICON_SRC}" PLUME_ICON_PATH)

  # --- Version / metadata variables (defaults, overrideable via -D on CMake configure) ---
  # Generate a .rc in the build directory based on the template in src/Resources
  configure_file(${CMAKE_SOURCE_DIR}/src/Resources/PlumeEngine.rc.in
           ${CMAKE_BINARY_DIR}/PlumeEngine.rc @ONLY)

  # Add the generated .rc to the executable target so it gets compiled and linked
  target_sources(PlumeEngine PRIVATE ${CMAKE_BINARY_DIR}/PlumeEngine.rc)
endif()