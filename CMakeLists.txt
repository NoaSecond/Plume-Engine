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