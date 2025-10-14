// src/Core/Input.cpp
#include "Input.h"

void Input::BeginNewFrame() {
    // Réinitialiser les entrées qui ne sont pas des états (comme "touche enfoncée")
    m_MouseXRel = 0;
    m_MouseYRel = 0;
    m_MouseWheelY = 0;
}

void Input::Update(const SDL_Event& e) {
    if (e.type == SDL_KEYDOWN) {
        m_KeyStates[e.key.keysym.scancode] = true;
    } else if (e.type == SDL_KEYUP) {
        m_KeyStates[e.key.keysym.scancode] = false;
    } else if (e.type == SDL_MOUSEBUTTONDOWN) {
        m_MouseButtonStates[e.button.button] = true;
    } else if (e.type == SDL_MOUSEBUTTONUP) {
        m_MouseButtonStates[e.button.button] = false;
    } else if (e.type == SDL_MOUSEMOTION) {
        m_MouseXRel = e.motion.xrel;
        m_MouseYRel = e.motion.yrel;
    } else if (e.type == SDL_MOUSEWHEEL) {
        m_MouseWheelY = e.wheel.y;
    }
}

bool Input::IsKeyPressed(SDL_Scancode key) {
    auto it = m_KeyStates.find(key);
    if (it != m_KeyStates.end()) {
        return it->second;
    }
    return false;
}

bool Input::IsMouseButtonPressed(int button) {
    auto it = m_MouseButtonStates.find(button);
    if (it != m_MouseButtonStates.end()) {
        return it->second;
    }
    return false;
}

void Input::GetMouseMotion(int& x, int& y) {
    x = m_MouseXRel;
    y = m_MouseYRel;
}

int Input::GetMouseWheelY() {
    return m_MouseWheelY;
}