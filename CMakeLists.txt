# Version minimale de CMake requise
cmake_minimum_required(VERSION 3.15)

# Nom du projet
project(PlumeEngine)

# Utiliser le mode CONFIG pour que vcpkg fournisse les bons fichiers
find_package(SDL2 CONFIG REQUIRED)
find_package(glad CONFIG REQUIRED)
find_package(glm CONFIG REQUIRED)

# NOUVEAU : Collecter automatiquement tous les fichiers sources
file(GLOB_RECURSE SOURCES "src/*.cpp")

# Définition de l'exécutable et des fichiers source
add_executable(PlumeEngine ${SOURCES})

# NOUVEAU : Ajouter le dossier "src" aux chemins d'inclusion
# pour que #include "Core/Application.h" fonctionne
target_include_directories(PlumeEngine PRIVATE src)

# Lien avec les bibliothèques
target_link_libraries(PlumeEngine PRIVATE 
    SDL2::SDL2 
    SDL2::SDL2main 
    glad::glad
    glm::glm
)