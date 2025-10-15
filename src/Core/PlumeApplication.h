// src/Core/PlumeApplication.h
#pragma once

#include <memory>
// Nous n'avons plus besoin d'inclure les classes de rendu ici
#include "../Scene/Scene.h"

struct SDL_Window;
typedef void* SDL_GLContext;

class PlumeApplication {
public:
    PlumeApplication();
    ~PlumeApplication();

    void Run();

private:
    void Init();
    void Shutdown();
    void ShowAbout();

    SDL_Window* m_Window = nullptr;
    SDL_GLContext m_GLContext = nullptr;
    bool m_IsRunning = true;

    // Cache the current relative mouse mode state to avoid redundant SDL calls
    bool m_RelativeMouseEnabled = false;

    // NOUVEAU : L'application possède maintenant une scène active
    std::unique_ptr<Scene> m_ActiveScene;

    // Editor layer for ImGui-based editor UI
    class EditorLayer* m_EditorLayer = nullptr;

    // Le reste est géré par la scène et la caméra
    class Camera* m_Camera = nullptr; // On gardera un pointeur brut pour un accès rapide
    class Input* m_Input = nullptr;
    bool m_RenderToFramebuffer = true;
    int m_LastDrawnMeshCount = 0;
    // (no temporary ignore flag anymore)
};