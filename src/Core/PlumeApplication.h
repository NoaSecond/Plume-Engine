// src/Core/PlumeApplication.h
#pragma once

#include <memory>
// Nous n'avons plus besoin d'inclure les classes de rendu ici
#include "../Scene/Scene.h"

struct SDL_Window;
typedef void* SDL_GLContext;

// Forward declarations
class EditorLayer; 
class Camera;
class Input;

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

    // Editor layer (MODIFIÉ: utilise unique_ptr)
    std::unique_ptr<EditorLayer> m_EditorLayer;

    // Le reste est géré par la scène et la caméra (MODIFIÉ: utilise unique_ptr)
    std::unique_ptr<Camera> m_Camera;
    std::unique_ptr<Input> m_Input;
    bool m_RenderToFramebuffer = true;
    int m_LastDrawnMeshCount = 0;
    // (no temporary ignore flag anymore)
};