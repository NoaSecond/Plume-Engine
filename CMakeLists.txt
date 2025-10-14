# Version minimale de CMake requise
cmake_minimum_required(VERSION 3.15)
project(PlumeEngine)

# Définir la norme C++17 pour le projet
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_CXX_EXTENSIONS OFF)

# --- GESTION DES DÉPENDANCES ---
# On utilise vcpkg pour les bibliothèques qui fonctionnent bien
set(CMAKE_TOOLCHAIN_FILE "C:/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "Vcpkg toolchain file")
find_package(SDL2 CONFIG REQUIRED)
find_package(glad CONFIG REQUIRED)
find_package(glm CONFIG REQUIRED)
find_package(assimp CONFIG REQUIRED)

# On utilise FetchContent pour les bibliothèques "header-only" pour plus de robustesse
include(FetchContent)

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
)

# Lier toutes les bibliothèques
target_link_libraries(PlumeEngine PRIVATE
    SDL2::SDL2
    SDL2::SDL2main
    glad::glad
    glm::glm
    assimp::assimp
    # Pas besoin de lier entt ou stb car elles sont "header-only"
)

# Copier les assets dans le dossier de build après la compilation
add_custom_command(TARGET PlumeEngine POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    ${CMAKE_SOURCE_DIR}/assets $<TARGET_FILE_DIR:PlumeEngine>/assets
    COMMENT "Copying assets to build directory"
)

# Copy runtime DLLs from vcpkg installed tree (Windows) to output directory
if(WIN32)
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

  # Generate a .rc in the build directory based on the template in src/Resources
  configure_file(${CMAKE_SOURCE_DIR}/src/Resources/PlumeEngine.rc.in
           ${CMAKE_BINARY_DIR}/PlumeEngine.rc @ONLY)

  # Add the generated .rc to the executable target so it gets compiled and linked
  target_sources(PlumeEngine PRIVATE ${CMAKE_BINARY_DIR}/PlumeEngine.rc)
endif()