// src/Core/Input.h
#pragma once

#include <SDL2/SDL.h>
#include <unordered_map>

class Input {
public:
    void Update(const SDL_Event& e);

    bool IsKeyPressed(SDL_Scancode key);
    bool IsMouseButtonPressed(int button);

    // Retourne le mouvement de la souris depuis la dernière frame
    void GetMouseMotion(int& x, int& y);

private:
    std::unordered_map<SDL_Scancode, bool> m_KeyStates;
    std::unordered_map<int, bool> m_MouseButtonStates;
    int m_MouseXRel = 0;
    int m_MouseYRel = 0;
};