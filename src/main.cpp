// Plume Engine - src/main.cpp
// ----------------------------

#include <iostream> 
// Inclure GLAD AVANT SDL_opengl.h ou tout autre header OpenGL
#include <glad/glad.h> 
#include <SDL2/SDL.h>

// On définit des constantes pour la taille de la fenêtre.
const int WINDOW_WIDTH = 1280;
const int WINDOW_HEIGHT = 720;

int main(int argc, char* argv[]) {

    // --- 1. INITIALISATION DE SDL ---
    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        std::cerr << "Erreur lors de l'initialisation de SDL : " << SDL_GetError() << std::endl;
        return -1;
    }
    std::cout << "SDL initialise avec succes !" << std::endl;

    // --- NOUVEAU : Configuration d'OpenGL AVANT de créer la fenêtre ---
    // On spécifie la version d'OpenGL que l'on veut utiliser (ici, 3.3)
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);
    // On choisit le profil "core", qui n'inclut pas les anciennes fonctions d'OpenGL
    SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);

    // --- 2. CRÉATION DE LA FENÊTRE ---
    SDL_Window* window = SDL_CreateWindow(
        "Plume Engine v0.1",
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        WINDOW_WIDTH,
        WINDOW_HEIGHT,
        SDL_WINDOW_SHOWN | SDL_WINDOW_OPENGL // <-- AJOUTER le flag SDL_WINDOW_OPENGL
    );

    if (!window) {
        std::cerr << "Erreur lors de la creation de la fenetre : " << SDL_GetError() << std::endl;
        SDL_Quit();
        return -1;
    }

    // --- NOUVEAU : Création du contexte OpenGL ---
    // Le contexte OpenGL est lié à notre fenêtre. C'est notre "pinceau" pour dessiner.
    SDL_GLContext glContext = SDL_GL_CreateContext(window);
    if (!glContext) {
        std::cerr << "Erreur lors de la creation du contexte OpenGL : " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(window);
        SDL_Quit();
        return -1;
    }
    std::cout << "Contexte OpenGL cree avec succes !" << std::endl;

    // --- NOUVEAU : Initialisation de GLAD ---
    // GLAD va chercher les adresses des fonctions OpenGL dont on a besoin.
    if (!gladLoadGLLoader((GLADloadproc)SDL_GL_GetProcAddress)) {
        std::cerr << "Erreur lors de l'initialisation de GLAD" << std::endl;
        SDL_GL_DeleteContext(glContext);
        SDL_DestroyWindow(window);
        SDL_Quit();
        return -1;
    }
    std::cout << "GLAD initialise avec succes !" << std::endl;

    // --- 3. LA BOUCLE DE JEU (GAME LOOP) ---
    bool isRunning = true;
    while (isRunning) {
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                isRunning = false;
            }
        }

        // --- NOUVEAU : DESSIN (RENDER) ---
        // 1. On choisit une couleur pour effacer l'écran (ici un bleu foncé).
        // Les valeurs sont Rouge, Vert, Bleu, Alpha (transparence) entre 0.0 et 1.0.
        glClearColor(0.1f, 0.2f, 0.3f, 1.0f);
        
        // 2. On efface le "tampon de couleur" (ce qui est visible à l'écran).
        glClear(GL_COLOR_BUFFER_BIT);

        // 3. On échange les tampons. C'est le principe du "double buffering".
        // On dessine sur un tampon caché, puis on l'affiche d'un coup pour éviter le scintillement.
        SDL_GL_SwapWindow(window);
    }

    // --- 4. NETTOYAGE ---
    std::cout << "Fermeture de Plume Engine." << std::endl;
    SDL_GL_DeleteContext(glContext); // <-- Libérer le contexte OpenGL
    SDL_DestroyWindow(window);
    SDL_Quit();

    return 0;
}