# Version minimale de CMake requise
cmake_minimum_required(VERSION 3.15)
project(PlumeEngine)

# --- CONFIGURATION VCPKG FORCÉE ---
# Cette ligne force CMake à utiliser vcpkg. C'est la solution la plus fiable.
# Assurez-vous que le chemin "C:/vcpkg" est correct.
set(CMAKE_TOOLCHAIN_FILE "C:/vcpkg/scripts/buildsystems/vcpkg.cmake" CACHE STRING "Vcpkg toolchain file")

# Ajouter le chemin d'installation de vcpkg aux chemins de recherche de CMake
set(CMAKE_PREFIX_PATH "${CMAKE_PREFIX_PATH};C:/vcpkg/installed/x64-windows")

# Définir la norme C++17 pour le projet
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_CXX_EXTENSIONS OFF)

# --- GESTION DES DÉPENDANCES ---
# On utilise vcpkg pour les bibliothèques stables
find_package(SDL2 CONFIG REQUIRED)
find_package(glad CONFIG REQUIRED)
find_package(glm CONFIG REQUIRED)

# On utilise FetchContent pour EnTT pour garantir qu'il soit trouvé
include(FetchContent)
FetchContent_Declare(
  entt
  GIT_REPOSITORY https://github.com/skypjack/entt.git
  GIT_TAG        v3.13.0 # Utiliser une version stable
)
FetchContent_MakeAvailable(entt)
# --- FIN DU BLOC ---

# Collecter tous les fichiers sources du projet
file(GLOB_RECURSE SOURCES "src/*.cpp")

# Définir l'exécutable
add_executable(PlumeEngine ${SOURCES})

# Spécifier les chemins d'inclusion
target_include_directories(PlumeEngine PRIVATE 
    src
    ${entt_SOURCE_DIR}/src # Chemin pour EnTT (header-only)
)

# Lier toutes les bibliothèques
target_link_libraries(PlumeEngine PRIVATE
    SDL2::SDL2
    SDL2::SDL2main
    glad::glad
    glm::glm
    # Pas besoin de lier "entt" car il est header-only
)