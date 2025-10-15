// src/Core/PlumeApplication.h
#pragma once

#include <memory>
// Nous n'avons plus besoin d'inclure les classes de rendu ici
#include "../Scene/Scene.h"

// SDL forward declarations
struct SDL_Window;
typedef void* SDL_GLContext;

// Include complet nécessaire pour unique_ptr<EditorLayer>
#ifdef PLUME_ENABLE_IMGUI
#include "../Editor/EditorLayer.h"
#endif

// Forward declarations pour les autres classes
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

    // Sauvegarde de la position du curseur avant d'activer le mode relatif
    // pour pouvoir la restaurer au relâchement du bouton droit.
    int m_SavedMouseX = 0;
    int m_SavedMouseY = 0;
    bool m_HasSavedMousePos = false;

    // NOUVEAU : L'application possède maintenant une scène active
    std::unique_ptr<Scene> m_ActiveScene;

#ifdef PLUME_ENABLE_IMGUI
    // Editor layer (utilise unique_ptr)
    std::unique_ptr<EditorLayer> m_EditorLayer;
#endif

    // Le reste est géré par la scène et la caméra (utilise unique_ptr)
    std::unique_ptr<Camera> m_Camera;
    std::unique_ptr<Input> m_Input;
    bool m_RenderToFramebuffer = true;
    int m_LastDrawnMeshCount = 0;
};
