// Plume Engine - src/main.cpp
// ----------------------------

// On inclut les bibliothèques nécessaires.
// iostream pour afficher des messages dans la console (ex: les erreurs).
#include <iostream> 
// SDL.h est le fichier principal de la bibliothèque SDL2.
#include <SDL2/SDL.h>

// On définit des constantes pour la taille de la fenêtre.
// C'est une bonne pratique pour ne pas avoir de "nombres magiques" dans le code.
const int WINDOW_WIDTH = 1280;
const int WINDOW_HEIGHT = 720;

// 'main' est le point d'entrée de toute application C++.
int main(int argc, char* argv[]) {

    // --- 1. INITIALISATION DE SDL ---
    // On doit initialiser les sous-systèmes de SDL que l'on veut utiliser.
    // Ici, on a juste besoin de la vidéo pour créer une fenêtre.
    if (SDL_Init(SDL_INIT_VIDEO) != 0) {
        // Si l'initialisation échoue, SDL_GetError() nous donne la raison.
        // On l'affiche dans la console et on quitte le programme avec un code d'erreur.
        std::cerr << "Erreur lors de l'initialisation de SDL : " << SDL_GetError() << std::endl;
        return -1;
    }
    std::cout << "SDL initialise avec succes !" << std::endl;

    // --- 2. CRÉATION DE LA FENÊTRE ---
    // On crée la fenêtre en spécifiant son titre, sa position, ses dimensions et des options.
    SDL_Window* window = SDL_CreateWindow(
        "Plume Engine v0.1",      // Titre de la fenêtre
        SDL_WINDOWPOS_CENTERED,   // Position X centrée sur l'écran
        SDL_WINDOWPOS_CENTERED,   // Position Y centrée sur l'écran
        WINDOW_WIDTH,             // Largeur en pixels
        WINDOW_HEIGHT,            // Hauteur en pixels
        SDL_WINDOW_SHOWN          // On demande à ce que la fenêtre soit visible
    );

    // Si la création de la fenêtre échoue, la fonction retourne un pointeur nul.
    if (!window) {
        std::cerr << "Erreur lors de la creation de la fenetre : " << SDL_GetError() << std::endl;
        SDL_Quit(); // On nettoie SDL avant de quitter.
        return -1;
    }
    std::cout << "Fenetre creee avec succes !" << std::endl;

    // --- 3. LA BOUCLE DE JEU (GAME LOOP) ---
    // C'est le cœur du moteur. Elle tourne en continu tant que le jeu n'est pas quitté.
    bool isRunning = true;
    while (isRunning) {
        SDL_Event event;
        // On récupère et traite les événements (clavier, souris, fermeture de fenêtre...).
        while (SDL_PollEvent(&event)) {
            // Si l'utilisateur clique sur la croix de la fenêtre...
            if (event.type == SDL_QUIT) {
                // ... on met isRunning à false pour sortir de la boucle.
                isRunning = false;
            }
        }

        // MISE À JOUR (UPDATE) : la logique du jeu ira ici.
        
        // DESSIN (RENDER) : le code de dessin ira ici.
    }

    // --- 4. NETTOYAGE ---
    // Quand on sort de la boucle, on libère les ressources proprement.
    std::cout << "Fermeture de Plume Engine." << std::endl;
    SDL_DestroyWindow(window); // Détruit la fenêtre
    SDL_Quit();                // Arrête tous les sous-systèmes de SDL

    return 0; // Le programme s'est terminé sans erreur.
}