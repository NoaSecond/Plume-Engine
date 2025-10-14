# Version minimale de CMake requise
cmake_minimum_required(VERSION 3.15)

# Nom du projet
project(PlumeEngine)

# Utiliser le mode CONFIG pour que vcpkg fournisse le bon fichier SDL2Config.cmake
find_package(SDL2 CONFIG REQUIRED)

# Définition de l'exécutable et des fichiers source
add_executable(PlumeEngine src/main.cpp)

# Lien avec les bibliothèques SDL2 (core + main)
target_link_libraries(PlumeEngine PRIVATE SDL2::SDL2 SDL2::SDL2main)
