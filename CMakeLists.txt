# Version minimale de CMake requise
cmake_minimum_required(VERSION 3.15)

# Nom du projet
project(PlumeEngine)

# Utiliser le mode CONFIG pour que vcpkg fournisse les bons fichiers
find_package(SDL2 CONFIG REQUIRED)
find_package(glad CONFIG REQUIRED) # <-- AJOUTER GLAD
find_package(glm CONFIG REQUIRED)  # <-- AJOUTER GLM

# Définition de l'exécutable et des fichiers source
add_executable(PlumeEngine src/main.cpp)

# Lien avec les bibliothèques
target_link_libraries(PlumeEngine PRIVATE 
    SDL2::SDL2 
    SDL2::SDL2main 
    glad::glad      # <-- LIER GLAD
    glm::glm        # <-- LIER GLM
)